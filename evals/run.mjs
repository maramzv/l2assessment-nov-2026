// node evals/run.mjs legacy|rules|ai   (ai needs GROQ_API_KEY)
import Groq from 'groq-sdk'
const set = process.argv[3] === 'holdout' ? './messages-holdout.mjs' : './messages.mjs'
const { messages } = await import(set)
import { legacyUrgency } from './legacy-urgency.mjs'
import { resolveUrgency } from '../src/utils/urgencyScorer.js'
import { analyzeWithClient } from '../src/utils/llmHelper.js'

const mode = process.argv[2] || 'rules'
let urgOk = 0, catOk = 0, missed = 0, rows = []
const client = mode === 'ai' ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null

for (const t of messages) {
  let cat = '-', urg
  if (mode === 'legacy') urg = legacyUrgency(t.m)
  else if (mode === 'rules') { cat = t.cat[0]; urg = resolveUrgency(t.m, cat, null) } // no AI: rules only
  else { const r = await analyzeWithClient(client, t.m); cat = r.category; urg = r.urgency; if (r.source !== 'ai') urg += '(fallback)' }
  const uOk = t.urg.includes(urg), cOk = mode !== 'ai' || t.cat.includes(cat)
  if (uOk) urgOk++; if (cOk) catOk++
  if (t.urg.includes('High') && urg !== 'High') missed++
  rows.push({ message: t.m.slice(0, 55), expected: t.urg.join('/'), got: urg, ok: uOk ? 'yes' : 'NO', cat: cOk ? '' : `cat=${cat}` })
}
console.table(rows)
console.log(`${mode}: urgency ${urgOk}/${messages.length}` + (mode === 'ai' ? `, category ${catOk}/${messages.length}` : '') + `, High messages missed: ${missed}`)
