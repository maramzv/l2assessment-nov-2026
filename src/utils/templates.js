/**
 * Recommendation Templates - category (+ urgency) -> recommended action
 */

const actionTemplates = {
  'Billing Issue': {
    default: 'Check the customer\'s invoices and payment status, then reply with the fix or next step.',
    High: 'Billing lead: verify the charge now, refund any duplicate or wrong charge, and confirm with the customer today.',
  },
  'Technical Problem': {
    default: 'Collect steps to reproduce and browser/device details, then reply with a workaround or open a bug ticket.',
    High: 'Escalate to the on-call engineer immediately (15-minute response) and send the customer an acknowledgement.',
  },
  'General Inquiry': {
    default: 'Reply with the relevant FAQ or help-center link.',
  },
  'Feature Request': {
    default: 'Thank the customer, log the request with the product team, and tell them it was logged.',
  },
  'Customer Feedback': {
    default: 'Send a brief thank-you; no support action needed. Share praise with the team.',
  },
  Unknown: {
    default: 'Review manually.',
  },
}

export function getRecommendedAction(category, urgency) {
  const entry = actionTemplates[category]
  if (!entry) return 'No recommendation available.'
  return entry[urgency] || entry.default
}

export function getAvailableCategories() {
  return Object.keys(actionTemplates)
}

/** Escalate on impact (High urgency), not on message length. */
export function shouldEscalate(category, urgency) {
  return urgency === 'High' && category !== 'Customer Feedback'
}
