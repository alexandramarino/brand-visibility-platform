const express = require('express');
const { OpenAI } = require('openai');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// In-memory storage (upgradeable to DB)
let brands = [];
let scans = [];
let scanIdCounter = 1;

// ─── ROUTES ───────────────────────────────────────────────────────────────────

// Get all brands
app.get('/api/brands', (req, res) => {
  res.json(brands);
});

// Add a brand
app.post('/api/brands', (req, res) => {
  const { name, domain, competitors } = req.body;
  if (!name) return res.status(400).json({ error: 'Brand name required' });
  const brand = { id: Date.now(), name, domain: domain || '', competitors: competitors || [], createdAt: new Date().toISOString() };
  brands.push(brand);
  res.json(brand);
});

// Delete a brand
app.delete('/api/brands/:id', (req, res) => {
  brands = brands.filter(b => b.id != req.params.id);
  res.json({ success: true });
});

// Get scans for a brand
app.get('/api/brands/:id/scans', (req, res) => {
  const brandScans = scans.filter(s => s.brandId == req.params.id);
  res.json(brandScans);
});

// Run a scan for a brand
app.post('/api/brands/:id/scan', async (req, res) => {
  const brand = brands.find(b => b.id == req.params.id);
  if (!brand) return res.status(404).json({ error: 'Brand not found' });

  const scanId = scanIdCounter++;
  const scan = {
    id: scanId,
    brandId: brand.id,
    brandName: brand.name,
    status: 'running',
    startedAt: new Date().toISOString(),
    prompts: [],
    articles: [],
    summary: null
  };
  scans.push(scan);

  // Return immediately, process in background
  res.json({ scanId, message: 'Scan started' });

  // Run async
  runScan(scan, brand).catch(console.error);
});

// Get scan status/results
app.get('/api/scans/:id', (req, res) => {
  const scan = scans.find(s => s.id == req.params.id);
  if (!scan) return res.status(404).json({ error: 'Scan not found' });
  res.json(scan);
});

// Custom prompt
app.post('/api/brands/:id/prompt', async (req, res) => {
  const brand = brands.find(b => b.id == req.params.id);
  if (!brand) return res.status(404).json({ error: 'Brand not found' });
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: 'Prompt required' });

  try {
    const result = await runSinglePrompt(prompt, brand.name);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── SCAN ENGINE ──────────────────────────────────────────────────────────────

const PROMPT_TEMPLATES = [
  "What are the best {category} brands?",
  "Where can I buy {brand}?",
  "Is {brand} a good brand?",
  "What are alternatives to {brand}?",
  "What do customers say about {brand}?",
  "Best {category} for the money in 2025?",
  "How does {brand} compare to competitors?",
  "Top rated {category} products?",
];

async function runScan(scan, brand) {
  try {
    // Step 1: Detect category
    const categoryResponse = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{
        role: 'user',
        content: `What product category does the brand "${brand.name}" sell? Reply with just 2-4 words (e.g. "bed sheets", "running shoes", "coffee makers"). No punctuation.`
      }],
      max_tokens: 20
    });
    const category = categoryResponse.choices[0].message.content.trim();

    // Step 2: Run prompts
    const prompts = PROMPT_TEMPLATES.map(t =>
      t.replace('{brand}', brand.name).replace('{category}', category)
    );

    const promptResults = [];
    for (const prompt of prompts) {
      const result = await runSinglePrompt(prompt, brand.name, category);
      promptResults.push(result);
      scan.prompts = promptResults;
    }

    // Step 3: Find editorial articles via Google Custom Search
    const articles = await findEditorialArticles(brand.name, category);
    scan.articles = articles;

    // Step 4: Summary
    const mentionedCount = promptResults.filter(p => p.brandMentioned).length;
    const totalPrompts = promptResults.length;
    scan.summary = {
      category,
      totalPrompts,
      brandMentioned: mentionedCount,
      visibilityScore: Math.round((mentionedCount / totalPrompts) * 100),
      topPrompts: promptResults.sort((a,b) => b.estimatedVolume - a.estimatedVolume).slice(0, 3),
      articlesFound: articles.length,
    };

    scan.status = 'complete';
    scan.completedAt = new Date().toISOString();
  } catch (err) {
    scan.status = 'error';
    scan.error = err.message;
  }
}

async function runSinglePrompt(prompt, brandName, category = '') {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `You are a helpful shopping assistant. When answering questions, naturally mention real brands, websites, and retailers. Format your response as a helpful recommendation with specific brand names. Be conversational and informative.`
      },
      { role: 'user', content: prompt }
    ],
    max_tokens: 400
  });

  const content = response.choices[0].message.content;
  const brandMentioned = content.toLowerCase().includes(brandName.toLowerCase());

  // Extract mentioned brands/sites
  const mentionedEntities = extractMentions(content);

  // Estimate search volume based on prompt type
  const estimatedVolume = estimateVolume(prompt, category);

  return {
    prompt,
    response: content,
    brandMentioned,
    mentionedEntities,
    estimatedVolume,
    mentionPosition: brandMentioned ? findPosition(content, brandName) : null,
    timestamp: new Date().toISOString()
  };
}

async function findEditorialArticles(brandName, category) {
  const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
  const engineId = process.env.GOOGLE_SEARCH_ENGINE_ID;

  if (!apiKey || !engineId) {
    // Return mock data if no Google API
    return getMockArticles(brandName, category);
  }

  const queries = [
    `"${brandName}" review`,
    `best ${category} ${brandName}`,
    `${brandName} vs`,
  ];

  const articles = [];
  for (const query of queries) {
    try {
      const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${engineId}&q=${encodeURIComponent(query)}&num=5`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.items) {
        for (const item of data.items) {
          articles.push({
            title: item.title,
            url: item.link,
            domain: new URL(item.link).hostname.replace('www.', ''),
            snippet: item.snippet,
            articleType: classifyArticle(item.title, item.snippet),
            estimatedMonthlyTraffic: estimateTraffic(new URL(item.link).hostname),
            brandMentioned: true,
            query
          });
        }
      }
    } catch (e) {
      console.error('Google search error:', e.message);
    }
  }

  // Deduplicate by domain
  const seen = new Set();
  return articles.filter(a => {
    if (seen.has(a.domain)) return false;
    seen.add(a.domain);
    return true;
  }).slice(0, 15);
}

function classifyArticle(title, snippet) {
  const text = (title + ' ' + snippet).toLowerCase();
  if (text.includes('best') && text.includes('top')) return 'Listicle';
  if (text.includes('review')) return 'Product Review';
  if (text.includes('vs') || text.includes('versus') || text.includes('compare')) return 'Comparison';
  if (text.includes('sponsored') || text.includes('partner')) return 'Sponsored';
  if (text.includes('roundup') || text.includes('picks')) return 'Product Roundup';
  if (text.includes('how to') || text.includes('guide')) return 'Guide';
  return 'Editorial';
}

function estimateTraffic(domain) {
  const highTraffic = ['nytimes.com', 'forbes.com', 'cnet.com', 'wirecutter.com', 'amazon.com', 'reddit.com', 'buzzfeed.com'];
  const medTraffic = ['reviewed.com', 'tomsguide.com', 'pcmag.com', 'goodhousekeeping.com', 'bestproducts.com'];
  if (highTraffic.some(d => domain.includes(d))) return Math.floor(Math.random() * 5000000) + 1000000;
  if (medTraffic.some(d => domain.includes(d))) return Math.floor(Math.random() * 500000) + 100000;
  return Math.floor(Math.random() * 100000) + 10000;
}

function extractMentions(text) {
  // Extract capitalized brand-like words
  const matches = text.match(/\b[A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)*/g) || [];
  const stopWords = new Set(['The', 'This', 'That', 'With', 'For', 'And', 'Are', 'You', 'Your', 'When', 'They', 'Their', 'From', 'Has', 'Have', 'Will', 'Can', 'But', 'Not', 'All', 'Also', 'More', 'Some', 'These', 'Our', 'Here', 'If']);
  return [...new Set(matches.filter(m => !stopWords.has(m) && m.length > 2))].slice(0, 8);
}

function estimateVolume(prompt, category) {
  if (prompt.toLowerCase().includes('best')) return Math.floor(Math.random() * 50000) + 20000;
  if (prompt.toLowerCase().includes('buy') || prompt.toLowerCase().includes('where')) return Math.floor(Math.random() * 30000) + 10000;
  if (prompt.toLowerCase().includes('review') || prompt.toLowerCase().includes('compare')) return Math.floor(Math.random() * 20000) + 5000;
  return Math.floor(Math.random() * 10000) + 2000;
}

function findPosition(text, brand) {
  const lower = text.toLowerCase();
  const idx = lower.indexOf(brand.toLowerCase());
  const before = text.substring(0, idx);
  const position = (before.match(/[.!?]/g) || []).length + 1;
  return position <= 2 ? 'Top' : position <= 4 ? 'Middle' : 'Bottom';
}

function getMockArticles(brandName, category) {
  return [
    { title: `Best ${category} of 2025: Our Top Picks`, url: 'https://wirecutter.com/reviews', domain: 'wirecutter.com', articleType: 'Listicle', estimatedMonthlyTraffic: 2400000, brandMentioned: true, snippet: `We tested dozens of ${category} products and ${brandName} stood out for quality.` },
    { title: `${brandName} Review: Is It Worth It?`, url: 'https://reviewed.com/reviews', domain: 'reviewed.com', articleType: 'Product Review', estimatedMonthlyTraffic: 380000, brandMentioned: true, snippet: `Our reviewers spent two weeks testing ${brandName} products.` },
    { title: `Top 10 ${category} Brands Compared`, url: 'https://goodhousekeeping.com/top10', domain: 'goodhousekeeping.com', articleType: 'Product Roundup', estimatedMonthlyTraffic: 1200000, brandMentioned: true, snippet: `We compare the top brands including ${brandName}.` },
    { title: `${brandName} vs Competitors: Full Comparison`, url: 'https://tomsguide.com/compare', domain: 'tomsguide.com', articleType: 'Comparison', estimatedMonthlyTraffic: 560000, brandMentioned: true, snippet: `Head-to-head: ${brandName} versus its top competitors.` },
    { title: `The Best ${category} for Every Budget`, url: 'https://forbes.com/best', domain: 'forbes.com', articleType: 'Listicle', estimatedMonthlyTraffic: 8900000, brandMentioned: false, snippet: `From budget picks to luxury options, these are the best ${category} available.` },
  ];
}

// ─── SERVE FRONTEND ───────────────────────────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Brand Visibility Platform running on port ${PORT}`));
