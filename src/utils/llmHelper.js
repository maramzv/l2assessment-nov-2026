import Groq from 'groq-sdk'
import { resolveUrgency } from './urgencyScorer.js'
import { getRecommendedAction, shouldEscalate } from './templates.js'

/**
 * One structured LLM call returns category + urgency + reasoning.
 * Result carries `source: 'ai' | 'fallback'` so the UI can say when the AI was not used.
 */

export const MODEL = 'openai/gpt-oss-120b'

export const CATEGORIES = [
  'Billing Issue',
  'Technical Problem',
  'Feature Request',
  'General Inquiry',
  'Customer Feedback',
]

const SYSTEM_PROMPT = `You triage customer support messages for a small business.
Reply with ONLY a JSON object: {"category": string, "urgency": string, "reasoning": string}

category must be exactly one of:
- "Billing Issue": charges, refunds, invoices, payment failures, subscription/plan billing
- "Technical Problem": bugs, errors, outages, login/access problems, things not working
- "Feature Request": asks for new or improved functionality
- "General Inquiry": questions about how things work, pricing, hours, policies
- "Customer Feedback": praise, thanks or complaints with no action requested
If a message mixes billing and technical, choose the one that blocks the customer most.

urgency must be exactly "High", "Medium" or "Low", judged ONLY by business impact and time pressure:
- High: service/site/system down, data loss or security issue, customer charged wrongly/twice, customer fully blocked from work, revenue being lost, hard deadline within a day
- Medium: a real problem or question with a workaround or no immediate deadline, partial failures, single-user bugs
- Low: feature ideas, praise, general questions, anything with no negative impact
IGNORE tone, ALL CAPS, exclamation marks, politeness, message length and words like "URGENT" when the impact is small. A short calm message can be High; a loud one can be Low.

reasoning: 1-2 sentences naming the impact signal you used. Messages may be in any language; answer in English.`

let client = null
function getClient() {
  if (!client) {
    const apiKey = import.meta.env?.VITE_GROQ_API_KEY
    if (!apiKey || apiKey.startsWith('your_')) throw new Error('Missing VITE_GROQ_API_KEY')
    // Browser-side key: fine for this local assessment, NOT for production.
    client = new Groq({ apiKey, dangerouslyAllowBrowser: true })
  }
  return client
}

function parseModelJson(text) {
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('No JSON in model reply')
  return JSON.parse(match[0])
}

function build(message, category, modelUrgency, reasoning, source) {
  const urgency = resolveUrgency(message, category, modelUrgency)
  return {
    category,
    urgency,
    reasoning,
    recommendedAction: getRecommendedAction(category, urgency),
    escalate: shouldEscalate(category, urgency),
    source,
  }
}

/** Core logic, takes any Groq-compatible client so it can be tested in Node. */
export async function analyzeWithClient(groq, message) {
  try {
    const response = await groq.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: message },
      ],
      temperature: 0.2,
      response_format: { type: 'json_object' },
    })
    const parsed = parseModelJson(response.choices[0].message.content)
    const category = CATEGORIES.includes(parsed.category) ? parsed.category : 'Unknown'
    return build(message, category, parsed.urgency, String(parsed.reasoning || ''), 'ai')
  } catch (error) {
    console.warn('AI analysis failed, using fallback:', error.message)
    return fallbackAnalysis(message)
  }
}

export function analyzeMessage(message) {
  try {
    return analyzeWithClient(getClient(), message)
  } catch (error) {
    console.warn('AI unavailable:', error.message)
    return Promise.resolve(fallbackAnalysis(message))
  }
}

/** Minimal keyword fallback. Always flagged source:'fallback' so nobody mistakes it for AI. */
export function fallbackAnalysis(message) {
  const m = message.toLowerCase()
  let category = 'General Inquiry'
  if (/(charge|bill|invoice|refund|payment|subscription)/.test(m)) category = 'Billing Issue'
  else if (/(error|bug|broken|down|crash|not working|can't|cannot|login)/.test(m)) category = 'Technical Problem'
  else if (/(feature|add |wish|would be great)/.test(m)) category = 'Feature Request'
  else if (/^\W*(thank|great job|love)/.test(m)) category = 'Customer Feedback'
  return build(
    message,
    category,
    null,
    'The AI could not be reached, so this is a basic keyword guess. Please review manually.',
    'fallback'
  )
}
