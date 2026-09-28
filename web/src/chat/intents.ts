/**
 * Intent Classification Engine
 * Detects user query category from keywords/patterns.
 * No backend needed — runs entirely in the browser.
 */

export type IntentCategory =
  | 'erosion_amount'
  | 'accretion_amount'
  | 'net_change'
  | 'date_range'
  | 'satellite_info'
  | 'threshold_info'
  | 'rainfall'
  | 'water_level'
  | 'confidence'
  | 'verdict'
  | 'why_inconclusive'
  | 'rfi_issue'
  | 'sensor_checks'
  | 'biggest_erosion'
  | 'erosion_count'
  | 'location_info'
  | 'what_if_more_passes'
  | 'what_if_more_rain'
  | 'explain_simple'
  | 'recommendation'
  | 'greeting'
  | 'unknown';

interface IntentRule {
  intent: IntentCategory;
  keywords: string[];
  patterns?: RegExp[];
  priority: number;
}

const RULES: IntentRule[] = [
  // Greetings
  {
    intent: 'greeting',
    keywords: ['hi', 'hello', 'hey', 'assalamu', 'salam', 'help', 'start'],
    priority: 0,
  },

  // Erosion
  {
    intent: 'erosion_amount',
    keywords: ['erosion', 'land lost', 'land loss', 'eroded', 'ভাঙন', 'জমি নষ্ট', 'how much land', 'koto jomi'],
    patterns: [/how much.*(eroded|erosion|lost)/i, /land.*(lost|eroded|destroyed)/i],
    priority: 10,
  },

  // Accretion
  {
    intent: 'accretion_amount',
    keywords: ['accretion', 'new land', 'land formed', 'land gained', 'চর', 'নতুন জমি'],
    patterns: [/new.*(land|formation)/i, /land.*(formed|gained|created)/i],
    priority: 10,
  },

  // Net change
  {
    intent: 'net_change',
    keywords: ['net change', 'net loss', 'total change', 'overall', 'net'],
    patterns: [/net.*(change|loss|gain)/i],
    priority: 9,
  },

  // Date range
  {
    intent: 'date_range',
    keywords: ['when', 'date', 'time', 'period', 'কবে', 'কখন', 'সময়'],
    patterns: [/when.*(happen|detect|start)/i, /(from|between).*date/i],
    priority: 8,
  },

  // Satellite info
  {
    intent: 'satellite_info',
    keywords: ['satellite', 'nisar', 'sensor', 'radar', 'sar', 'স্যাটেলাইট'],
    patterns: [/which.*(satellite|sensor|radar)/i, /what.*(satellite|data)/i],
    priority: 7,
  },

  // Threshold
  {
    intent: 'threshold_info',
    keywords: ['threshold', 'otsu', 'db', 'decibel'],
    patterns: [/threshold/i],
    priority: 6,
  },

  // Rainfall
  {
    intent: 'rainfall',
    keywords: ['rain', 'rainfall', 'precipitation', 'weather', 'বৃষ্টি', 'আবহাওয়া'],
    patterns: [/rain/i, /precipit/i],
    priority: 8,
  },

  // Water level
  {
    intent: 'water_level',
    keywords: ['water level', 'stage', 'flood', 'পানি', 'বন্যা', 'পানির উচ্চতা'],
    patterns: [/water.*(level|height|stage)/i],
    priority: 8,
  },

  // Confidence
  {
    intent: 'confidence',
    keywords: ['confidence', 'reliable', 'trust', 'accurate', 'score', 'বিশ্বাস', 'নির্ভরযোগ্য'],
    patterns: [/(how|why).*(confiden|reliable|trust|accurate)/i, /confidence.*(?:low|high|score)/i],
    priority: 9,
  },

  // Verdict
  {
    intent: 'verdict',
    keywords: ['verdict', 'result', 'conclusion', 'finding', 'ফলাফল', 'রায়'],
    patterns: [/what.*(verdict|result|conclusion|finding)/i],
    priority: 8,
  },

  // Why inconclusive
  {
    intent: 'why_inconclusive',
    keywords: ['inconclusive', 'why not supported', 'why not confirmed'],
    patterns: [/why.*(inconclusive|not.*support|not.*confirm)/i],
    priority: 10,
  },

  // RFI
  {
    intent: 'rfi_issue',
    keywords: ['rfi', 'interference', 'radio', 'noise', 'signal'],
    patterns: [/radio.*interference/i, /rfi/i],
    priority: 7,
  },

  // Sensor checks
  {
    intent: 'sensor_checks',
    keywords: ['check', 'qc', 'quality', 'verification', 'cross-check', 'চেক'],
    patterns: [/(what|which).*(check|verified|sensor)/i, /quality.*control/i],
    priority: 6,
  },

  // Biggest erosion
  {
    intent: 'biggest_erosion',
    keywords: ['biggest', 'largest', 'worst', 'maximum', 'most', 'সবচেয়ে বড়'],
    patterns: [/(biggest|largest|worst|most).*(erosion|damage|loss)/i, /show.*big/i],
    priority: 10,
  },

  // Erosion count
  {
    intent: 'erosion_count',
    keywords: ['how many', 'count', 'total points', 'কয়টা', 'সংখ্যা'],
    patterns: [/how many.*(erosion|point|polygon|spot|zone)/i],
    priority: 8,
  },

  // Location
  {
    intent: 'location_info',
    keywords: ['where', 'location', 'area', 'place', 'chilmari', 'roumari', 'কোথায়', 'এলাকা'],
    patterns: [/where.*(is|are|happen)/i, /(which|what).*(area|place|location)/i],
    priority: 7,
  },

  // What-if: more passes
  {
    intent: 'what_if_more_passes',
    keywords: ['more passes', 'more data', 'another pass', 'more satellite', 'আরো ডেটা'],
    patterns: [/what.*if.*(more|another).*(pass|data|satellite|acquisition)/i],
    priority: 9,
  },

  // What-if: more rain
  {
    intent: 'what_if_more_rain',
    keywords: ['more rain', 'double rain', 'heavy rain', 'আরো বৃষ্টি'],
    patterns: [/what.*if.*(more|double|heavy|extreme).*rain/i],
    priority: 9,
  },

  // Explain simple
  {
    intent: 'explain_simple',
    keywords: ['explain', 'simple', 'summary', 'সহজ', 'বুঝিয়ে বলো', 'সারাংশ'],
    patterns: [/(explain|tell|summary).*(simple|easy|short)/i, /what.*happening/i, /what is this/i],
    priority: 5,
  },

  // Recommendation
  {
    intent: 'recommendation',
    keywords: ['recommend', 'should', 'next step', 'what to do', 'কী করা উচিত', 'পরামর্শ'],
    patterns: [/what.*(should|recommend|next|do)/i],
    priority: 6,
  },
];

export function classifyIntent(query: string): IntentCategory {
  const q = query.toLowerCase().trim();

  if (q.length < 2) return 'greeting';

  let bestIntent: IntentCategory = 'unknown';
  let bestScore = -1;

  for (const rule of RULES) {
    let score = 0;

    // Keyword matching
    for (const kw of rule.keywords) {
      if (q.includes(kw.toLowerCase())) {
        score += rule.priority + kw.split(' ').length; // multi-word keywords get bonus
      }
    }

    // Pattern matching
    if (rule.patterns) {
      for (const pat of rule.patterns) {
        if (pat.test(q)) {
          score += rule.priority + 5; // pattern matches get extra bonus
        }
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestIntent = rule.intent;
    }
  }

  return bestIntent;
}

/**
 * Returns suggested question chips based on the current context.
 */
export function getSuggestedQuestions(context: 'general' | 'detect' | 'investigate' | 'challenge' | 'map' | 'random'): string[] {
  const pools = {
    detect: [
      'How much land was eroded?',
      'What satellite was used?',
      'When was this detected?',
      'What does the threshold mean?',
      'Is there new land forming?'
    ],
    investigate: [
      'How was the rainfall?',
      'What is the water level?',
      'Which sensors were checked?',
      'Why is DSWx not evaluated?',
      'Was this caused by a flood?'
    ],
    challenge: [
      'Why is confidence so low?',
      'What is the RFI issue?',
      'Is this data reliable?',
      'What would improve confidence?',
      'Why is the result inconclusive?'
    ],
    map: [
      'Where is the biggest erosion?',
      'How many erosion zones are there?',
      'Show me the worst damage',
      'What happened near Chilmari?',
      'Where did the river migrate?'
    ],
    general: [
      'What is happening to this river?',
      'How much land was lost?',
      'Is this data reliable?',
      'Where is the biggest erosion?',
      'What should we do next?',
      'Tell me about the net change.',
      'Show me the forecast'
    ]
  };

  const selectedPool = context === 'random' 
    ? [...pools.detect, ...pools.investigate, ...pools.challenge, ...pools.map, ...pools.general]
    : pools[context] || pools.general;

  // Shuffle the pool and pick the first 3
  const shuffled = [...selectedPool].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 3);
}
