/**
 * Urgency rules.
 *
 * Urgency is judged by business impact (outage, money, blocked customer,
 * deadline) and NOT by style (length, caps, punctuation, politeness, time of day).
 * The LLM makes the main call; resolveUrgency() is a safety net so a bad model
 * answer can never bury a clear emergency.
 */

export const URGENCY_LEVELS = ['High', 'Medium', 'Low']

// Unambiguous critical signals (English + Spanish).
const CRITICAL_PATTERNS = [
  /\b(server|site|website|app|service|system|api|database|db|checkout|platform)\b.{0,30}\b(is |are )?(down|offline|unreachable|crashed|not responding)\b/i,
  /\b(down|outage)\b.{0,20}\b(now|right now|for (the )?(last )?\d+)/i,
  /\b(database|db)\b.{0,25}\b(lost|connection lost|corrupt|deleted|wiped)\b/i,
  /\b(charged|billed)\b.{0,20}\b(twice|two times|double|2x|again)\b/i,
  /\bdouble[- ]charged\b/i,
  /\b(can'?t|cannot|unable to) (log ?in|login|access|check ?out|process (payments|orders))\b.{0,40}\b(customers|team|everyone|all)\b/i,
  /\blosing (sales|money|customers|revenue|orders)\b/i,
  /\b(data (breach|leak)|hacked|security (breach|incident)|unauthori[sz]ed (charge|access))\b/i,
  /\bcobr(ado|ada|aron|ó)s?\b.{0,25}\bdos veces\b/i,
  /\b(nobody|no one|none of (us|my team))\b.{0,30}\b(can|able to)\b.{0,15}\b(log ?in|access|use|work)\b/i,
  /\b(servidor|sitio|sistema|app)\b.{0,25}\b(ca[ií]do|no funciona|fuera de servicio)\b/i,
]

// Messages that are clearly just thanks/praise should never be escalated by the model.
const PRAISE_PATTERN = /^\W*(thank(s| you)|gracias|great (job|work)|love (it|the|your))/i

export function hasCriticalSignal(message) {
  return CRITICAL_PATTERNS.some((re) => re.test(message))
}

/**
 * Combine the model's urgency with the safety rules.
 * - Critical signal in a Technical/Billing message => at least High.
 * - Otherwise trust the model (default Medium if the model gave nothing valid).
 */
export function resolveUrgency(message, category, modelUrgency) {
  const valid = URGENCY_LEVELS.includes(modelUrgency) ? modelUrgency : null
  const critical = hasCriticalSignal(message)
  if (critical && (category === 'Technical Problem' || category === 'Billing Issue')) {
    return 'High'
  }
  if (valid) return valid
  return PRAISE_PATTERN.test(message) && !critical ? 'Low' : 'Medium'
}
