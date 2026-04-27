import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function month(y: number, m: number) {
  return `${y}-${String(m).padStart(2, '0')}`;
}

function d(y: number, m: number, day: number) {
  return new Date(y, m - 1, day);
}

async function main() {
  await prisma.transaction.deleteMany();
  await prisma.account.deleteMany();
  await prisma.exchangeRate.deleteMany();

  // Exchange rates
  await prisma.exchangeRate.createMany({
    data: [
      { fromCurrency: 'GBP', toCurrency: 'ILS', rate: 4.72 },
      { fromCurrency: 'USD', toCurrency: 'ILS', rate: 3.73 },
    ],
  });

  // GBP account
  const gbp = await prisma.account.create({ data: { currency: 'GBP' } });
  // ILS account
  const ils = await prisma.account.create({ data: { currency: 'ILS' } });
  // USD account
  const usd = await prisma.account.create({ data: { currency: 'USD' } });

  // --- GBP Transactions ---
  const gbpTx = [
    // January 2026
    { date: d(2026,1,5),  description: 'Client payment - Acme Corp',       amount: 8500,   category: 'Sales Revenue',            month: month(2026,1) },
    { date: d(2026,1,10), description: 'Consulting service fee',            amount: 3200,   category: 'Service Revenue',          month: month(2026,1) },
    { date: d(2026,1,1),  description: 'Office rent - January',             amount: -2100,  category: 'Rent & Office',            month: month(2026,1) },
    { date: d(2026,1,25), description: 'Staff salaries',                    amount: -6500,  category: 'Staff & Salaries',         month: month(2026,1) },
    { date: d(2026,1,15), description: 'AWS cloud services',                amount: -380,   category: 'Infrastructure & Software',month: month(2026,1) },
    { date: d(2026,1,18), description: 'Google Ads campaign',               amount: -750,   category: 'Marketing & Ads',          month: month(2026,1) },
    { date: d(2026,1,20), description: 'Office supplies',                   amount: -210,   category: 'General Expenses',         month: month(2026,1) },
    { date: d(2026,1,28), description: 'HMRC VAT payment',                  amount: -1200,  category: 'Taxes & Compliance',       month: month(2026,1) },
    // February 2026
    { date: d(2026,2,3),  description: 'Client payment - Beta Ltd',         amount: 6200,   category: 'Sales Revenue',            month: month(2026,2) },
    { date: d(2026,2,12), description: 'Support contract renewal',          amount: 1800,   category: 'Service Revenue',          month: month(2026,2) },
    { date: d(2026,2,1),  description: 'Office rent - February',            amount: -2100,  category: 'Rent & Office',            month: month(2026,2) },
    { date: d(2026,2,25), description: 'Staff salaries',                    amount: -6500,  category: 'Staff & Salaries',         month: month(2026,2) },
    { date: d(2026,2,14), description: 'GitHub Enterprise',                 amount: -190,   category: 'Infrastructure & Software',month: month(2026,2) },
    { date: d(2026,2,20), description: 'LinkedIn Ads',                      amount: -600,   category: 'Marketing & Ads',          month: month(2026,2) },
    { date: d(2026,2,22), description: 'Business insurance',                amount: -450,   category: 'Taxes & Compliance',       month: month(2026,2) },
    // March 2026
    { date: d(2026,3,7),  description: 'Client payment - Gamma PLC',        amount: 11000,  category: 'Sales Revenue',            month: month(2026,3) },
    { date: d(2026,3,15), description: 'Freelance project delivery',        amount: 2500,   category: 'Service Revenue',          month: month(2026,3) },
    { date: d(2026,3,1),  description: 'Office rent - March',               amount: -2100,  category: 'Rent & Office',            month: month(2026,3) },
    { date: d(2026,3,25), description: 'Staff salaries',                    amount: -6500,  category: 'Staff & Salaries',         month: month(2026,3) },
    { date: d(2026,3,10), description: 'Supplier materials',                amount: -1200,  category: 'Suppliers & Materials',    month: month(2026,3) },
    { date: d(2026,3,18), description: 'Datadog monitoring',                amount: -290,   category: 'Infrastructure & Software',month: month(2026,3) },
    { date: d(2026,3,22), description: 'Trade show sponsorship',            amount: -1500,  category: 'Marketing & Ads',          month: month(2026,3) },
    { date: d(2026,3,28), description: 'Bank loan repayment',               amount: -800,   category: 'Loans & Finance',          month: month(2026,3) },
  ];

  // --- ILS Transactions ---
  const ilsTx = [
    // January 2026
    { date: d(2026,1,4),  description: 'לקוח ראשי - תשלום חודשי',           amount: 28000,  category: 'Sales Revenue',            month: month(2026,1) },
    { date: d(2026,1,10), description: 'שירות ייעוץ - פרויקט A',             amount: 12000,  category: 'Service Revenue',          month: month(2026,1) },
    { date: d(2026,1,1),  description: 'שכירות משרד - ינואר',               amount: -8500,  category: 'Rent & Office',            month: month(2026,1) },
    { date: d(2026,1,26), description: 'שכר עובדים - ינואר',                amount: -35000, category: 'Staff & Salaries',         month: month(2026,1) },
    { date: d(2026,1,15), description: 'ספק חומרים - הזמנה #101',           amount: -4200,  category: 'Suppliers & Materials',    month: month(2026,1) },
    { date: d(2026,1,18), description: 'קמפיין פרסום דיגיטלי',              amount: -3500,  category: 'Marketing & Ads',          month: month(2026,1) },
    { date: d(2026,1,20), description: 'מס הכנסה מקדמה',                   amount: -5000,  category: 'Taxes & Compliance',       month: month(2026,1) },
    { date: d(2026,1,22), description: 'אחסון ענן - AWS',                   amount: -900,   category: 'Infrastructure & Software',month: month(2026,1) },
    // February 2026
    { date: d(2026,2,5),  description: 'לקוח ראשי - תשלום חודשי',           amount: 28000,  category: 'Sales Revenue',            month: month(2026,2) },
    { date: d(2026,2,12), description: 'פרויקט מיוחד - לקוח B',             amount: 18000,  category: 'Service Revenue',          month: month(2026,2) },
    { date: d(2026,2,1),  description: 'שכירות משרד - פברואר',              amount: -8500,  category: 'Rent & Office',            month: month(2026,2) },
    { date: d(2026,2,26), description: 'שכר עובדים - פברואר',               amount: -35000, category: 'Staff & Salaries',         month: month(2026,2) },
    { date: d(2026,2,14), description: 'ביטוח עסקי',                       amount: -2400,  category: 'Taxes & Compliance',       month: month(2026,2) },
    { date: d(2026,2,20), description: 'ציוד משרדי',                       amount: -1800,  category: 'General Expenses',         month: month(2026,2) },
    { date: d(2026,2,23), description: 'תוכנות ורישיונות',                  amount: -1200,  category: 'Infrastructure & Software',month: month(2026,2) },
    // March 2026
    { date: d(2026,3,6),  description: 'לקוח ראשי - תשלום חודשי',           amount: 28000,  category: 'Sales Revenue',            month: month(2026,3) },
    { date: d(2026,3,14), description: 'שירות ייעוץ - פרויקט C',             amount: 9500,   category: 'Service Revenue',          month: month(2026,3) },
    { date: d(2026,3,20), description: 'הכנסה נוספת - לקוח חדש',            amount: 6000,   category: 'Sales Revenue',            month: month(2026,3) },
    { date: d(2026,3,1),  description: 'שכירות משרד - מרץ',                 amount: -8500,  category: 'Rent & Office',            month: month(2026,3) },
    { date: d(2026,3,26), description: 'שכר עובדים - מרץ',                  amount: -35000, category: 'Staff & Salaries',         month: month(2026,3) },
    { date: d(2026,3,12), description: 'ספק חומרים - הזמנה #115',           amount: -5500,  category: 'Suppliers & Materials',    month: month(2026,3) },
    { date: d(2026,3,18), description: 'פייסבוק ואינסטגרם - פרסום',         amount: -2800,  category: 'Marketing & Ads',          month: month(2026,3) },
    { date: d(2026,3,28), description: 'הלוואה עסקית - החזר חודשי',         amount: -3000,  category: 'Loans & Finance',          month: month(2026,3) },
  ];

  // --- USD Transactions ---
  const usdTx = [
    // January 2026
    { date: d(2026,1,6),  description: 'Client payment - US Corp',          amount: 12000,  category: 'Sales Revenue',            month: month(2026,1) },
    { date: d(2026,1,13), description: 'SaaS subscription revenue',         amount: 3500,   category: 'Service Revenue',          month: month(2026,1) },
    { date: d(2026,1,25), description: 'Staff salary - US team',            amount: -8000,  category: 'Staff & Salaries',         month: month(2026,1) },
    { date: d(2026,1,15), description: 'AWS US region',                     amount: -850,   category: 'Infrastructure & Software',month: month(2026,1) },
    { date: d(2026,1,18), description: 'Google Ads US',                     amount: -1200,  category: 'Marketing & Ads',          month: month(2026,1) },
    { date: d(2026,1,20), description: 'Stripe payment processing fees',    amount: -320,   category: 'General Expenses',         month: month(2026,1) },
    { date: d(2026,1,28), description: 'IRS estimated tax payment',         amount: -2000,  category: 'Taxes & Compliance',       month: month(2026,1) },
    // February 2026
    { date: d(2026,2,4),  description: 'Client payment - TechStart Inc',    amount: 9500,   category: 'Sales Revenue',            month: month(2026,2) },
    { date: d(2026,2,11), description: 'Annual license renewal',            amount: 4200,   category: 'Service Revenue',          month: month(2026,2) },
    { date: d(2026,2,25), description: 'Staff salary - US team',            amount: -8000,  category: 'Staff & Salaries',         month: month(2026,2) },
    { date: d(2026,2,14), description: 'Cloudflare & Vercel',               amount: -220,   category: 'Infrastructure & Software',month: month(2026,2) },
    { date: d(2026,2,19), description: 'HubSpot CRM',                       amount: -450,   category: 'Marketing & Ads',          month: month(2026,2) },
    { date: d(2026,2,22), description: 'Legal & compliance fees',           amount: -1800,  category: 'Taxes & Compliance',       month: month(2026,2) },
    // March 2026
    { date: d(2026,3,5),  description: 'Client payment - Global Ventures',  amount: 18000,  category: 'Sales Revenue',            month: month(2026,3) },
    { date: d(2026,3,13), description: 'API usage fees income',             amount: 2800,   category: 'Service Revenue',          month: month(2026,3) },
    { date: d(2026,3,25), description: 'Staff salary - US team',            amount: -8000,  category: 'Staff & Salaries',         month: month(2026,3) },
    { date: d(2026,3,10), description: 'Hardware & equipment',              amount: -2500,  category: 'Suppliers & Materials',    month: month(2026,3) },
    { date: d(2026,3,18), description: 'AWS + GCP services',                amount: -1100,  category: 'Infrastructure & Software',month: month(2026,3) },
    { date: d(2026,3,22), description: 'Conference & events',               amount: -3000,  category: 'Marketing & Ads',          month: month(2026,3) },
    { date: d(2026,3,28), description: 'Bank loan payment',                 amount: -1500,  category: 'Loans & Finance',          month: month(2026,3) },
  ];

  await prisma.transaction.createMany({
    data: gbpTx.map(t => ({ ...t, accountId: gbp.id })),
  });
  await prisma.transaction.createMany({
    data: ilsTx.map(t => ({ ...t, accountId: ils.id })),
  });
  await prisma.transaction.createMany({
    data: usdTx.map(t => ({ ...t, accountId: usd.id })),
  });

  console.log('✅ Seed completed successfully');
  console.log(`   GBP: ${gbpTx.length} transactions`);
  console.log(`   ILS: ${ilsTx.length} transactions`);
  console.log(`   USD: ${usdTx.length} transactions`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
