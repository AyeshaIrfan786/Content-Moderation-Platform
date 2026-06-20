const CATEGORIES = [
  'graphic_violence', 'hate_symbols', 'self_harm',
  'extremist_propaganda', 'weapons_contraband', 'harassment_humiliation'
];

const MODERATION_PROMPT = `Analyze this image against these 6 moderation categories: ${CATEGORIES.join(', ')}.
For EACH category, return classification result, confidence score (0-100), and a short reasoning string.
Respond ONLY with valid JSON, no markdown, no preamble, in this exact format:
[{"category":"graphic_violence","result":"clean or violation","confidence":0,"reasoning":"..."}, ...]
Include all 6 categories in the array, even if clean with low confidence.`;

const SAFETY_BLOCK_REASONING =
  'Content blocked by AI safety filter before classification';

const safetyBlockResults = (reasoning = SAFETY_BLOCK_REASONING) =>
  CATEGORIES.map(category => ({
    category,
    result: 'violation',
    confidence: 100,
    reasoning
  }));

const parseModerationJson = (text) => {
  const cleaned = text.replace(/```json|```/g, '').trim();
  const results = JSON.parse(cleaned);

  if (!Array.isArray(results) || results.length === 0) {
    throw new Error('AI returned an empty moderation result');
  }

  return results;
};

const validateGeminiKey = (apiKey) => {
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set in backend/.env');
  }
  const isLegacyKey = apiKey.startsWith('AIza');
  const isAuthKey = apiKey.startsWith('AQ.');
  if (!isLegacyKey && !isAuthKey) {
    throw new Error(
      'Invalid GEMINI_API_KEY. Create a key at https://aistudio.google.com/api-keys — it should start with AIza (legacy) or AQ. (auth key).'
    );
  }
};

const getGeminiModel = () =>
  process.env.GEMINI_MODEL || 'gemini-2.5-flash';

const formatGeminiError = (message) => {
  if (!/quota|ResourceExhausted|429/i.test(message)) return message;

  const model = getGeminiModel();
  return [
    `Gemini quota error (${model}): ${message}`,
    'Fix: In Google AI Studio go to Settings → Billing and link a billing account to this project (free tier still applies).',
    'Then create a fresh API key, update GEMINI_API_KEY in backend/.env, and restart the backend.',
    'Optional: set GEMINI_MODEL=gemini-2.5-flash-lite for higher free daily limits.'
  ].join(' ');
};

const analyzeWithGemini = async (base64Image, mimeType) => {
  const apiKey = process.env.GEMINI_API_KEY;
  validateGeminiKey(apiKey);

  const model = getGeminiModel();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey
    },
    body: JSON.stringify({
      contents: [{
        parts: [
          { text: MODERATION_PROMPT },
          { inline_data: { mime_type: mimeType, data: base64Image } }
        ]
      }],
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' }
      ],
      generationConfig: {
        responseMimeType: 'application/json'
      }
    })
  });

  const data = await response.json();

  if (data.error) {
    throw new Error(formatGeminiError(data.error.message));
  }

  if (!response.ok) {
    throw new Error(`Gemini API request failed (${response.status})`);
  }

  const candidate = data.candidates?.[0];

  if (!candidate?.content?.parts?.[0]?.text) {
    const blockReason = data.promptFeedback?.blockReason;
    if (blockReason) {
      return safetyBlockResults(
        `Content blocked by AI safety filter (${blockReason})`
      );
    }
    if (candidate?.finishReason === 'SAFETY') {
      return safetyBlockResults();
    }
    throw new Error('Gemini returned no analysis for this image.');
  }

  return parseModerationJson(candidate.content.parts[0].text);
};

const analyzeImage = async (base64Image, mimeType) => {
  return analyzeWithGemini(base64Image, mimeType);
};

module.exports = { analyzeImage, CATEGORIES };
