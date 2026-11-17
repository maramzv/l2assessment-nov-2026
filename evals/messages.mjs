// expect: acceptable categories + urgencies (a support lead would accept any listed)
export const messages = [
  { m: 'Database connection lost', cat: ['Technical Problem'], urg: ['High'] },
  { m: 'Server down now', cat: ['Technical Problem'], urg: ['High'] },
  { m: 'I WAS CHARGED TWICE AND I WANT MY MONEY BACK NOW', cat: ['Billing Issue'], urg: ['High'] },
  { m: 'Our checkout page is down and we are losing sales every minute.', cat: ['Technical Problem'], urg: ['High'] },
  { m: 'Me cobraron dos veces este mes, por favor ayuda.', cat: ['Billing Issue'], urg: ['High'] },
  { m: 'Thank you so much! Your team has been incredibly helpful and I really appreciate the fast response!', cat: ['Customer Feedback', 'General Inquiry'], urg: ['Low'] },
  { m: 'Could you add an export to CSV feature? Would be really useful for my monthly reports.', cat: ['Feature Request'], urg: ['Low'] },
  { m: 'URGENT!!! WHEN WILL YOU ADD DARK MODE???', cat: ['Feature Request'], urg: ['Low'] },
  { m: 'How do I change the email on my account?', cat: ['General Inquiry'], urg: ['Low'] },
  { m: 'The export button sometimes shows an error but works on retry.', cat: ['Technical Problem'], urg: ['Medium', 'Low'] },
  { m: 'My payment failed and now I cannot access the dashboard. Is it a bug or my card?', cat: ['Billing Issue', 'Technical Problem'], urg: ['High', 'Medium'] },
  { m: 'Hi, could you please send me a copy of last month\'s invoice when you get a chance? Thanks!', cat: ['Billing Issue', 'General Inquiry'], urg: ['Low'] },
  { m: 'Nobody on my team can log in and we have a client presentation in one hour.', cat: ['Technical Problem'], urg: ['High'] },
  { m: 'The site is not down, I just wanted to ask what your support hours are.', cat: ['General Inquiry'], urg: ['Low'] },
]
