# Relay AI Customer Inbox Triage: Assessment (November 2026)

The product only works if it (1) routes messages correctly and (2) never lets an urgent one sit in the queue. Findings are judged against those two goals.

## Top 3 areas for improvement

1. **Urgency scoring is backwards (biggest business impact).** `urgencyScorer.js` scored style, not impact: short messages, ALL CAPS, "please/thanks", `?`, the reader's clock and `!` all moved the score. Result: "Server down now" and "Database connection lost" are **Low**, "I WAS CHARGED TWICE..." is **Low**, a thank-you with `!` is boosted. Outages and double charges are the costliest misses.
2. **Category detection is fragile and fails silently.** The prompt had no category list; code searched the model's free text for words like "billing" ("this is *not* billing" -> Billing). Anything else became `Unknown`. The configured model (`llama-3.3-70b-versatile`) was also retired, so errors were swallowed and **fake keyword answers were shown as if they were AI**.
3. **Recommended actions and escalation are wrong.** Every technical problem says "restart your browser", Feature Requests say "check billing portal" (copy-paste bug), and `shouldEscalate` returns true for any message over 100 characters.

## What I implemented (urgency first, plus the two related fixes)

- `llmHelper.js`: one structured JSON call returning category, urgency and reasoning. The prompt defines the categories and an impact-based urgency rubric that explicitly ignores tone, caps, punctuation, politeness and length. Model switched to `openai/gpt-oss-120b`. Client is lazy (no crash without a key). Results carry `source: 'ai' | 'fallback'`.
- `urgencyScorer.js`: `resolveUrgency()` safety net. A Technical/Billing message with an unambiguous critical signal (outage, DB lost, charged twice, team locked out, English + Spanish) can never be below High, even if the model slips.
- `templates.js`: per-category actions, faster owner-specific actions for High, added `Customer Feedback`, escalation follows urgency.
- `AnalyzePage.jsx`: uses the new function, shows an "Escalate now" tag and a yellow warning when the AI was not used.

## Testing

`evals/messages.mjs` has 14 messages (outages, shouting, politeness, negation "the site is *not* down", Spanish, mixed billing/technical). Acceptable answers are fixed in advance.

```bash
node evals/run.mjs legacy   # original urgency logic
node evals/run.mjs rules    # new safety-net rules only, no AI
GROQ_API_KEY=... node evals/run.mjs ai   # full new pipeline
```

| Version | Urgency correct (14) | High-urgency messages missed |
|---|---|---|
| Original logic | 5/14 | 7 of 7 |
| New rules only (no AI) | 9/14 | 1 of 7 |
| New full pipeline (AI + rules) | **not yet measured** | - |

The "rules only" row is a floor: it has no AI, so it cannot tell a feature request from a general question. It shows the safety net alone fixes most missed emergencies.

## Limitations / next steps

- The live AI run was not completed because no Groq API key was available when I built this. AI-quality claims are untested until `node evals/run.mjs ai` is run.
- Small sample, one run, LLM not deterministic.
- API key is still exposed in the browser (`dangerouslyAllowBrowser`); move the call to a backend before real use.
- Next: agent feedback loop to correct labels, real routing to named teams, and fixing the pre-existing lint errors in `DashboardPage`, `HistoryPage`, `HomePage`.
