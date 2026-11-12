// Content data for generated pages (services, blog, per-page FAQs).

const SERVICES = [
  { slug: 'virtual-executive-assistant', name: 'Virtual Executive Assistant', desc: 'Calendar management, email management, scheduling, research, travel coordination, reporting and administrative support.', items: ['Calendar management', 'Email management', 'Scheduling', 'Research', 'Travel coordination', 'Reporting', 'Administrative support'] },
  { slug: 'social-media-management', name: 'Social Media Management', desc: 'Content planning, scheduling, publishing, community management, analytics and social media support.', items: ['Content planning', 'Scheduling', 'Publishing', 'Community management', 'Analytics', 'Social media support'] },
  { slug: 'website-development', name: 'Website Development', desc: 'Business websites, landing pages, WordPress development, maintenance, updates and technical support.', items: ['Business websites', 'Landing pages', 'WordPress development', 'Maintenance', 'Updates', 'Technical support'] },
  { slug: 'real-estate-support', name: 'Real Estate Support', desc: 'Property research, lead management, CRM updates, listing support, appointment scheduling and administrative assistance.', items: ['Property research', 'Lead management', 'CRM updates', 'Listing support', 'Appointment scheduling', 'Administrative assistance'] },
  { slug: 'sales-lead-generation', name: 'Sales & Lead Generation', desc: 'Lead research, prospecting, cold calling, email outreach, appointment setting, CRM management and follow-ups.', items: ['Lead research', 'Prospecting', 'Cold calling', 'Email outreach', 'Appointment setting', 'CRM management', 'Follow-ups'] },
  { slug: 'content-creation', name: 'Content Creation', desc: 'Blogs, website content, social media content, email content, marketing copy and business communications.', items: ['Blogs', 'Website content', 'Social media content', 'Email content', 'Marketing copy', 'Business communications'] },
  { slug: 'seo-management', name: 'SEO Management', desc: 'Keyword research, on-page SEO, local SEO, content optimization, competitor research and reporting.', items: ['Keyword research', 'On-page SEO', 'Local SEO', 'Content optimization', 'Competitor research', 'Reporting'] },
  { slug: 'graphic-design', name: 'Graphic Design', desc: 'Social media creatives, presentations, advertisements, brochures, marketing materials and business graphics.', items: ['Social media creatives', 'Presentations', 'Advertisements', 'Brochures', 'Marketing materials', 'Business graphics'] },
  { slug: 'bookkeeping-accounting-support', name: 'Bookkeeping & Accounting Support', desc: 'Bookkeeping, accounts payable, accounts receivable, invoice management, expense tracking, accounting data entry and QuickBooks support.', items: ['Bookkeeping', 'Accounts payable', 'Accounts receivable', 'Invoice management', 'Expense tracking', 'Accounting data entry', 'QuickBooks support'] }
];

const serviceFaqs = s => [
  [`Who will handle ${s.name} for my business?`, 'A dedicated JurisAssistMe professional matched to your requirements. You review the profile and interview them before moving forward.'],
  [`Can I start with ${s.name} and add other roles later?`, 'Yes. Start with one professional and expand into a complete remote support team as your needs grow.'],
  ['Which tools and hours will the professional work with?', 'Your professional works in your systems, on your schedule and following your processes. We confirm tools, time zone and working hours during setup.'],
  [`How is ${s.name} priced?`, 'Pricing is confirmed per engagement based on the scope and hours you need. Contact us for a recommendation.']
];

const PAGE_FAQS = {
  index: [
    ['What is JurisAssistMe?', 'JurisAssistMe provides dedicated virtual professionals and managed remote support to U.S. businesses across operations, sales, marketing, finance, real estate and technology.'],
    ['Is JurisAssistMe a freelancer marketplace?', 'No. We match, manage and support professionals who work as part of your team, with coordination, performance monitoring and continuity handled for you.'],
    ['Which time zones do you cover?', 'We support U.S. businesses across Eastern, Central, Mountain and Pacific time, with flexible working hours.']
  ],
  services: [
    ['Can I combine more than one service?', 'Yes. Many businesses start with one role and add others, such as an executive assistant alongside lead generation or bookkeeping support.'],
    ['Do I get to meet the professional first?', 'Yes. You review the profile and interview the selected professional before moving forward.'],
    ['How much do services cost?', 'Pricing is confirmed per engagement based on the roles, scope and hours you need. Contact us for a recommendation.']
  ],
  solutions: [
    ['What happens after I get in touch?', 'We learn your requirements, responsibilities and preferred working hours, then identify and match professionals based on what you need.'],
    ['Do I have to commit before meeting anyone?', 'No. You review the profile and interview the selected professional before moving forward.'],
    ['What if something changes with my professional?', 'Continuity is part of our managed support, so your work does not stop if something changes.']
  ],
  'why-jurisassistme': [
    ['How is JurisAssistMe different from a freelancer platform?', 'We do not just list profiles. We match, manage and support your professional, including coordination, performance monitoring and operational support.'],
    ['Can I start with one person?', 'Yes. Start with one professional and scale into a complete remote team when you are ready.'],
    ['Is the cost comparison on this page exact?', 'No. It is an illustration only. Pricing is confirmed per engagement.']
  ],
  industries: [
    ['Do you support my industry?', 'We support law firms, real estate, accounting and CPA firms, e-commerce, professional services, and startups and small businesses. If you are not listed, contact us and we will tell you whether we are a fit.'],
    ['Can support scale with busy seasons?', 'Yes. Flexible scaling means you can add professionals when workload peaks, such as tax season for accounting firms.']
  ],
  about: [
    ['What does JurisAssistMe do?', 'We help U.S. businesses access skilled virtual professionals across business support, sales, marketing, finance, real estate and technology.'],
    ['How do I get started?', 'Contact us by email or phone. We will learn what you need and come back with a recommended team structure.']
  ],
  contact: [
    ['What should I include when I reach out?', 'The roles you need, your preferred working hours and time zone, and the tools your team already uses. Rough is fine; we will refine it together.'],
    ['When can I call?', 'Our phone line is open Monday to Friday, 9 AM to 6 PM.']
  ]
};

module.exports = { SERVICES, PAGE_FAQS, serviceFaqs };
