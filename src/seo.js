// Keyword-focused content for services, industries and top-level pages.
// Claims are kept to what J Assist states elsewhere on the site: no statistics, guarantees or named clients.

const COMMON = {
  hire: 'Start by telling us what you need: the tasks, responsibilities and working hours. We match a professional to your requirements, you review the profile and interview them, and only then do they join your team.',
  price: 'Pricing is confirmed per engagement based on the scope, role and hours you need. Contact us and we will recommend a team structure and quote for your business.'
};

const SERVICE_SEO = {
  'virtual-executive-assistant': {
    kw: 'virtual executive assistant',
    title: 'Virtual Executive Assistant Services | J Assist',
    meta: 'Hire a dedicated virtual executive assistant for calendar, email, scheduling, research, travel and reporting. Managed by J Assist for U.S. businesses.',
    h1: 'Virtual Executive Assistant Services for U.S. Businesses',
    p1: 'A virtual executive assistant from J Assist takes the day-to-day administration off founders, executives and business owners. From inbox and calendar management to travel coordination and reporting, your dedicated virtual executive assistant works inside your tools and on your schedule.',
    p2: 'Every J Assist virtual assistant is matched to your requirements, supported by a managed process and introduced to you for interview before they start. Instead of finding, vetting and managing a freelancer yourself, you get a remote executive assistant who works as part of your team.',
    benefits: [['Reclaim leadership time', 'Hand off email, scheduling and travel so you can focus on decisions only you can make.'], ['A dedicated professional', 'One assistant matched to your business and working as part of your team.'], ['Works in your systems', 'Your virtual assistant uses your email, calendar and tools, following your processes.'], ['Hours that fit your day', 'Agree working hours that line up with your U.S. time zone.']],
    best: ['Founders and CEOs', 'Executives and consultants', 'Real estate agents and brokers', 'Law firm partners', 'Small-business owners'],
    faqs: [
      ['What does a virtual executive assistant do?', 'A virtual executive assistant handles administrative and organizational work remotely: calendar and email management, scheduling, research, travel coordination, reporting and general administrative support.'],
      ['How is a virtual executive assistant different from a freelancer?', 'A J Assist professional is matched to your requirements and supported by managed coordination and performance monitoring, so you are not sourcing, vetting and managing a freelancer on your own.'],
      ['Can a virtual executive assistant manage my calendar and inbox?', 'Yes. Calendar management and email management are core tasks, handled inside the tools you already use, following your preferences.'],
      ['How do I hire a virtual executive assistant?', COMMON.hire]
    ]
  },
  'social-media-management': {
    kw: 'social media management',
    title: 'Social Media Management Services for U.S. Businesses | J Assist',
    meta: 'Outsource social media management: content planning, scheduling, publishing, community management and analytics from a dedicated remote professional.',
    h1: 'Social Media Management Services for U.S. Businesses',
    p1: 'Consistent social media takes planning, publishing and follow-through. J Assist gives your business a dedicated remote social media manager who plans content, schedules and publishes posts, engages with your community and reports on how it performs.',
    p2: 'Working inside your brand guidelines and approval process, your social media professional keeps your channels active so you can stay focused on running the business. Start with one platform or a full content calendar and scale as your needs grow.',
    benefits: [['Consistent publishing', 'A planned content calendar and scheduled posts keep your channels active.'], ['Community engagement', 'Comments and messages are monitored so your audience hears back.'], ['Clear reporting', 'Analytics show what is working so content can be refined over time.'], ['Scales with you', 'Add platforms, formats or more hours as your business grows.']],
    best: ['Small businesses and startups', 'E-commerce brands', 'Real estate agents', 'Professional services firms', 'Agencies and consultants'],
    faqs: [
      ['What does social media management include?', 'Content planning, scheduling, publishing, community management, analytics and general social media support.'],
      ['Can you manage several social media platforms?', 'Yes. Scope is set per engagement, so you can start with one platform and add more as needed.'],
      ['Will I approve content before it is published?', 'You decide the approval process. Your professional follows your brand guidelines and your preferred review steps.'],
      ['How do I outsource social media management to J Assist?', COMMON.hire]
    ]
  },
  'website-development': {
    kw: 'website development',
    title: 'Website Development & WordPress Support | J Assist',
    meta: 'Business websites, landing pages, WordPress development, maintenance and updates from a dedicated remote web professional for U.S. businesses.',
    h1: 'Website Development & WordPress Support for U.S. Businesses',
    p1: 'Your website is often the first impression customers get. J Assist provides remote web professionals who build business websites and landing pages, develop in WordPress, and keep your site updated, maintained and running.',
    p2: 'Whether you need a new site, ongoing updates or day-to-day technical support, a dedicated professional becomes your point of contact for website work, following your brand, your priorities and your schedule.',
    benefits: [['New sites and landing pages', 'Business websites and landing pages built around your goals.'], ['WordPress expertise', 'WordPress development, updates and maintenance in one place.'], ['Ongoing technical support', 'Someone to handle edits, fixes and updates as they come up.'], ['Flexible engagement', 'Hire for a project or keep a professional on for continuing work.']],
    best: ['Small businesses', 'Law firms and professional services', 'Real estate teams', 'E-commerce stores', 'Startups'],
    faqs: [
      ['What website development services do you offer?', 'Business websites, landing pages, WordPress development, maintenance, updates and technical support.'],
      ['Can you maintain my existing WordPress website?', 'Yes. Maintenance, updates and technical support for existing sites are part of the service.'],
      ['Can I hire a web developer for a one-time project?', 'Scope and duration are set per engagement, so you can discuss a defined project or ongoing support.'],
      ['How do I start a website project with J Assist?', COMMON.hire]
    ]
  },
  'real-estate-support': {
    kw: 'real estate virtual assistant',
    title: 'Real Estate Virtual Assistant Services | J Assist',
    meta: 'Real estate virtual assistant for property research, lead management, CRM updates, listing support and scheduling for U.S. agents and brokerages.',
    h1: 'Real Estate Virtual Assistant Services for U.S. Agents & Brokerages',
    p1: 'Agents and brokerages lose hours to paperwork, follow-ups and scheduling. A J Assist real estate virtual assistant handles property research, lead management, CRM updates, listing support and appointment scheduling so you can spend more time with clients.',
    p2: 'Your dedicated professional works in your CRM and systems, following your processes, and acts as an extension of your team. Start with one assistant and add roles as your pipeline grows.',
    benefits: [['More time with clients', 'Hand off admin so agents can focus on showings, negotiations and relationships.'], ['Tidy lead follow-up', 'Leads are logged in your CRM and followed up consistently.'], ['Listing and scheduling help', 'Listing support and appointment scheduling handled for you.'], ['Scales with your pipeline', 'Add support when volume increases and adjust when it slows.']],
    best: ['Real estate agents', 'Brokerages and teams', 'Property managers', 'Investors', 'Transaction coordinators'],
    faqs: [
      ['What does a real estate virtual assistant do?', 'Property research, lead management, CRM updates, listing support, appointment scheduling and administrative assistance.'],
      ['Can a virtual assistant update my CRM and follow up with leads?', 'Yes. CRM updates and lead management are core tasks, handled in the system you already use.'],
      ['Is this suitable for a small real estate team?', 'Yes. You can start with one professional and scale up as your team grows.'],
      ['How do I hire a real estate virtual assistant?', COMMON.hire]
    ]
  },
  'sales-lead-generation': {
    kw: 'lead generation',
    title: 'Sales & Lead Generation Services | Outsourced SDR | J Assist',
    meta: 'Outsource lead research, prospecting, cold calling, email outreach, appointment setting and CRM follow-ups to a dedicated remote sales support professional.',
    h1: 'Sales Support & Lead Generation Services for U.S. Businesses',
    p1: 'A steady pipeline needs consistent prospecting. J Assist provides dedicated remote professionals for lead research, prospecting, cold calling, email outreach, appointment setting, CRM management and follow-ups, so your sales team can focus on closing.',
    p2: 'Your sales support professional works from your target criteria, scripts and CRM, keeping records current and handing qualified conversations to you. Start with outreach for one offer and expand as results come in.',
    benefits: [['Consistent prospecting', 'Daily outreach and follow-up instead of sporadic effort.'], ['Appointment setting', 'Conversations scheduled directly on your calendar.'], ['Clean CRM records', 'Contacts, notes and next steps kept up to date.'], ['Sales team focus', 'Your closers spend time on live opportunities, not research.']],
    best: ['B2B service companies', 'Agencies and consultants', 'Real estate teams', 'Accounting and law firms', 'Startups'],
    faqs: [
      ['What is included in outsourced lead generation?', 'Lead research, prospecting, cold calling, email outreach, appointment setting, CRM management and follow-ups.'],
      ['Can you set appointments on my calendar?', 'Yes. Appointment setting is part of the service, using your calendar and your qualification criteria.'],
      ['Does J Assist guarantee sales results?', 'No. We provide dedicated professionals and managed support; results depend on your offer, market and process.'],
      ['How do I start with a remote sales support professional?', COMMON.hire]
    ]
  },
  'content-creation': {
    kw: 'content creation',
    title: 'Content Creation & Copywriting Services | J Assist',
    meta: 'Outsource content creation: blogs, website content, social posts, email content and marketing copy from a dedicated remote content professional.',
    h1: 'Content Creation & Copywriting Services for U.S. Businesses',
    p1: 'Good content builds trust and attracts customers, but it takes time to produce. J Assist provides remote content professionals who write blogs, website content, social media content, email content, marketing copy and business communications in your voice.',
    p2: 'Working from your brand guidelines and goals, your content writer can support your SEO and marketing plans with a steady stream of clear, useful copy. Pair content creation with SEO management or social media management for a complete marketing team.',
    benefits: [['Steady publishing', 'A consistent flow of blogs, emails and web copy.'], ['Written in your voice', 'Content follows your brand guidelines and tone.'], ['Built to support SEO', 'Copy planned around the topics and keywords your customers search for.'], ['One team for marketing', 'Combine with SEO, social media and design support.']],
    best: ['Small businesses', 'Law and accounting firms', 'E-commerce brands', 'Real estate agents', 'Agencies'],
    faqs: [
      ['What types of content can you create?', 'Blogs, website content, social media content, email content, marketing copy and business communications.'],
      ['Can content be written to support SEO?', 'Yes. Content can be planned around target keywords and combined with our SEO management service.'],
      ['Will the content match my brand voice?', 'Your professional works from your brand guidelines and examples, and you review content as part of the process.'],
      ['How do I hire a content writer through J Assist?', COMMON.hire]
    ]
  },
  'seo-management': {
    kw: 'SEO management',
    title: 'SEO Management Services for U.S. Businesses | J Assist',
    meta: 'Outsource SEO management: keyword research, on-page and local SEO, content optimization and reporting from a dedicated remote professional.',
    h1: 'SEO Management Services for U.S. Businesses',
    p1: 'Search visibility takes steady, detailed work. J Assist provides dedicated remote SEO professionals who handle keyword research, on-page SEO, local SEO, content optimization, competitor research and reporting.',
    p2: 'Your SEO specialist works alongside your content and website support to improve how your business appears in search, with regular reporting so you can see what has been done. SEO is a long-term effort, and we do not promise specific rankings.',
    benefits: [['Keyword-led planning', 'Research into the terms your customers actually search for.'], ['On-page and local SEO', 'Pages, listings and local signals optimized for search.'], ['Competitor insight', 'See what competing sites are doing and where gaps exist.'], ['Transparent reporting', 'Regular updates on work completed and performance.']],
    best: ['Local service businesses', 'Law and accounting firms', 'Real estate agents', 'E-commerce stores', 'New websites that need visibility'],
    faqs: [
      ['What does SEO management include?', 'Keyword research, on-page SEO, local SEO, content optimization, competitor research and reporting.'],
      ['Can you help with local SEO for my business?', 'Yes. Local SEO is part of the service for businesses that serve customers in specific areas.'],
      ['Will you guarantee first-page rankings?', 'No. Search results depend on many factors, and we do not guarantee specific rankings. We provide consistent, well-documented SEO work.'],
      ['How do I hire an SEO specialist through J Assist?', COMMON.hire]
    ]
  },
  'graphic-design': {
    kw: 'graphic design',
    title: 'Graphic Design Services for Small Business | J Assist',
    meta: 'Outsource graphic design: social media creatives, presentations, ads, brochures and marketing materials from a dedicated remote designer for U.S. businesses.',
    h1: 'Graphic Design Services for U.S. Businesses',
    p1: 'Professional visuals make your business look credible. J Assist provides remote graphic designers who create social media creatives, presentations, advertisements, brochures, marketing materials and business graphics.',
    p2: 'Your dedicated designer works from your brand colors, fonts and examples to keep everything consistent across channels. Combine design with social media management and content creation for a complete marketing team.',
    benefits: [['Consistent branding', 'Designs follow your brand so every channel looks like you.'], ['Everyday and campaign work', 'Quick social graphics and larger marketing pieces.'], ['Presentation-ready', 'Decks and brochures prepared for clients and meetings.'], ['A dedicated designer', 'One point of contact who learns your style over time.']],
    best: ['Small businesses', 'Real estate agents', 'E-commerce brands', 'Professional services firms', 'Startups'],
    faqs: [
      ['What graphic design work can you handle?', 'Social media creatives, presentations, advertisements, brochures, marketing materials and business graphics.'],
      ['Will designs follow my brand guidelines?', 'Yes. Your designer works from your brand guidelines and examples you provide.'],
      ['Can graphic design be combined with social media management?', 'Yes. Many clients pair design with social media and content support.'],
      ['How do I hire a graphic designer through J Assist?', COMMON.hire]
    ]
  },
  'bookkeeping-accounting-support': {
    kw: 'bookkeeping support',
    title: 'Bookkeeping & Accounting Support Services | J Assist',
    meta: 'Outsource bookkeeping support: AP, AR, invoices, expense tracking, data entry and QuickBooks help from a dedicated remote professional.',
    h1: 'Bookkeeping & Accounting Support for U.S. Businesses',
    p1: 'Accurate books depend on consistent day-to-day work. J Assist provides dedicated remote professionals for bookkeeping, accounts payable, accounts receivable, invoice management, expense tracking, accounting data entry and QuickBooks support.',
    p2: 'Your bookkeeping professional works in your accounting software and follows your approval steps, keeping records organized so you or your accountant can review them. This is administrative and bookkeeping support, not tax, audit or financial advice, and J Assist is not a CPA firm.',
    benefits: [['Records kept current', 'Invoices, bills and expenses entered and organized regularly.'], ['QuickBooks support', 'Help working inside QuickBooks day to day.'], ['You stay in control', 'You keep approval of payments and anything unusual.'], ['Scales with demand', 'Add support for busy periods and adjust afterwards.']],
    best: ['Small businesses', 'Accounting and CPA firms', 'Law firms', 'E-commerce stores', 'Real estate teams'],
    faqs: [
      ['What does bookkeeping support include?', 'Bookkeeping, accounts payable, accounts receivable, invoice management, expense tracking, accounting data entry and QuickBooks support.'],
      ['Can you work inside QuickBooks?', 'Yes. QuickBooks support is part of the service, in your own account and under your access rules.'],
      ['Is J Assist a CPA firm or does it provide tax advice?', 'No. We provide bookkeeping and administrative support and do not provide tax, audit or financial advice. Speak to your accountant or CPA for that.'],
      ['How do I hire a bookkeeping assistant?', COMMON.hire]
    ]
  }
};

const INDUSTRY_SEO = [
  {
    slug: 'law-firms', name: 'Law Firms', kw: 'virtual legal assistant',
    title: 'Virtual Assistant for Law Firms | Remote Legal Support | J Assist',
    meta: 'Remote virtual assistants for law firms: client intake, scheduling, document formatting, billing support and follow-ups so attorneys stay on billable work.',
    h1: 'Virtual Assistant Support for Law Firms',
    p1: 'Attorneys spend too much time on administration. J Assist provides virtual assistants for law firms who support client intake, scheduling, document formatting, billing support and client follow-ups, so your attorneys can stay on billable work.',
    p2: 'Your dedicated professional works in your practice-management tools under your supervision. J Assist professionals provide administrative support only and do not give legal advice or act as legal representatives.',
    tasks: ['Client intake and follow-ups', 'Calendar and court-date scheduling', 'Document formatting', 'Billing and invoicing support', 'Email and inbox management', 'Research and administrative tasks'],
    services: ['virtual-executive-assistant', 'bookkeeping-accounting-support', 'content-creation', 'seo-management'],
    faqs: [['Can a virtual assistant help my law firm with client intake?', 'Yes. Intake, scheduling and client follow-ups are common tasks, handled under your instructions in your systems.'], ['Do virtual assistants provide legal advice?', 'No. J Assist professionals provide administrative support only. Legal advice remains with your attorneys.'], ['Can I add marketing support for my firm?', 'Yes. Content creation, SEO management and website support can be added alongside administrative support.']]
  },
  {
    slug: 'real-estate', name: 'Real Estate', kw: 'real estate virtual assistant',
    title: 'Real Estate Virtual Assistant for Agents | J Assist',
    meta: 'Virtual assistants for real estate agents and brokerages: listing coordination, CRM updates, lead follow-up, showing schedules and transaction paperwork.',
    h1: 'Virtual Assistants for Real Estate Agents & Brokerages',
    p1: 'Real estate runs on timely follow-up. J Assist provides virtual assistants for real estate agents and brokerages who handle listing coordination, CRM updates, lead follow-up, showing schedules and transaction paperwork.',
    p2: 'A dedicated professional works in your CRM and tools, keeping leads and listings organized while you focus on clients. Start with one assistant and scale with your pipeline.',
    tasks: ['Listing coordination and support', 'CRM updates and lead follow-up', 'Showing and appointment scheduling', 'Transaction paperwork support', 'Property research', 'Social media and design support'],
    services: ['real-estate-support', 'virtual-executive-assistant', 'social-media-management', 'graphic-design'],
    faqs: [['What can a real estate virtual assistant do for my brokerage?', 'Listing coordination, CRM updates, lead follow-up, showing schedules, property research and transaction paperwork support.'], ['Can the assistant work in my CRM?', 'Yes. Your professional works inside the CRM and tools you already use.'], ['Can I add marketing help for my listings?', 'Yes. Social media management and graphic design can be added to support your marketing.']]
  },
  {
    slug: 'accounting-cpa-firms', name: 'Accounting & CPA Firms', kw: 'virtual assistant for accountants',
    title: 'Virtual Assistant for Accounting & CPA Firms | J Assist',
    meta: 'Virtual bookkeeping and admin support for accounting and CPA firms: AP/AR, reconciliations, data entry and QuickBooks support that scales with tax season.',
    h1: 'Virtual Assistants for Accounting & CPA Firms',
    p1: 'Accounting firms face busy seasons and routine data entry year-round. J Assist provides remote professionals for bookkeeping, accounts payable and receivable, reconciliations, accounting data entry and QuickBooks support that scales with tax season and steadies the rest of the year.',
    p2: 'Your dedicated professional follows your procedures and review steps, freeing your team for advisory and review work. J Assist provides administrative and bookkeeping support and is not a CPA firm.',
    tasks: ['Accounts payable and receivable', 'Bank and account reconciliations', 'Accounting data entry', 'QuickBooks support', 'Client document follow-up', 'Scheduling and admin support'],
    services: ['bookkeeping-accounting-support', 'virtual-executive-assistant', 'content-creation', 'seo-management'],
    faqs: [['Can a virtual assistant help during tax season?', 'Yes. Flexible scaling lets you add support during busy periods and adjust afterwards.'], ['Which accounting software can the assistant use?', 'QuickBooks support is available, and we confirm other tools during setup.'], ['Does J Assist provide tax or CPA services?', 'No. We provide bookkeeping and administrative support only, under your firm’s direction.']]
  },
  {
    slug: 'e-commerce', name: 'E-commerce', kw: 'e-commerce virtual assistant',
    title: 'E-commerce Virtual Assistant Services | J Assist',
    meta: 'E-commerce virtual assistants for store operations, product listings, customer email, social content and order support for online sellers in the U.S.',
    h1: 'E-commerce Virtual Assistant Services',
    p1: 'Running an online store means constant small tasks. J Assist provides e-commerce virtual assistants for store operations, product listings, customer email, social content and order support to keep your storefront moving.',
    p2: 'A dedicated professional works in your store platform and tools, so you can concentrate on products, suppliers and growth. Add marketing roles such as content creation, SEO and design as your store expands.',
    tasks: ['Product listings and updates', 'Customer email support', 'Order support', 'Social media content', 'Content and product descriptions', 'Bookkeeping support'],
    services: ['social-media-management', 'content-creation', 'seo-management', 'graphic-design'],
    faqs: [['What can an e-commerce virtual assistant handle?', 'Store operations, product listings, customer email, social content and order support.'], ['Can I get help with product descriptions and SEO?', 'Yes. Content creation and SEO management can be added for product pages and your wider store.'], ['Can I scale support for busy seasons?', 'Yes. Start small and add professionals when volume rises.']]
  },
  {
    slug: 'professional-services', name: 'Professional Services', kw: 'virtual assistant for consultants',
    title: 'Virtual Assistants for Professional Services Firms | J Assist',
    meta: 'Remote virtual assistants for consultancies and agencies: executive assistance, proposal support, reporting and client communication.',
    h1: 'Virtual Assistants for Consultancies & Professional Services',
    p1: 'Consultancies and agencies sell expertise, not administration. J Assist provides virtual assistants for professional services firms who provide executive assistance, proposal support, reporting and client communication.',
    p2: 'A dedicated professional keeps projects, schedules and client communication organized, working in your tools and following your processes. Add sales support and marketing roles as the firm grows.',
    tasks: ['Executive assistance', 'Proposal and document support', 'Reporting', 'Client communication', 'Scheduling and coordination', 'Lead generation support'],
    services: ['virtual-executive-assistant', 'sales-lead-generation', 'content-creation', 'graphic-design'],
    faqs: [['How can a virtual assistant support a consultancy?', 'With executive assistance, proposal support, reporting, scheduling and client communication.'], ['Can I add lead generation to administrative support?', 'Yes. Sales and lead generation support can be added to fill your pipeline.'], ['Will the assistant work in our tools?', 'Yes. Your professional works in your systems, on your schedule.']]
  },
  {
    slug: 'startups-small-businesses', name: 'Startups & Small Businesses', kw: 'virtual assistant for small business',
    title: 'Virtual Assistant for Small Business & Startups | J Assist',
    meta: 'Virtual assistants for startups and small businesses: start with one assistant and grow into a full remote team without building HR.',
    h1: 'Virtual Assistants for Startups & Small Businesses',
    p1: 'Small teams wear many hats. J Assist gives startups and small businesses a flexible bench of virtual specialists, from your first assistant to a full remote support team, without building HR from scratch.',
    p2: 'Begin with one role, such as a virtual executive assistant, and add sales, marketing, design, website or bookkeeping support as you grow. A managed model means matching and coordination are handled for you.',
    tasks: ['Executive and admin support', 'Sales and lead generation', 'Social media and content', 'Website and design support', 'Bookkeeping support', 'A growing multi-role team'],
    services: ['virtual-executive-assistant', 'sales-lead-generation', 'social-media-management', 'bookkeeping-accounting-support'],
    faqs: [['Can a small business start with just one virtual assistant?', 'Yes. Start with one professional and expand into a larger remote team over time.'], ['Do I need to handle HR and payroll for a virtual assistant?', 'J Assist handles matching, coordination and managed support, so you are not building HR processes from scratch.'], ['What roles should a startup hire first?', 'Many start with an executive assistant, then add sales, marketing or bookkeeping support. We can recommend a structure for your business.']]
  }
];

// Keyword-rich explanatory copy shown above the FAQ on top-level pages.
const PAGE_COPY = {
  index: {
    kicker: 'About our services', h2: 'Virtual Assistant Services & Remote Teams for U.S. Businesses',
    paras: [
      'J Assist provides <a href="/services">virtual assistant services</a> and dedicated remote teams for U.S. businesses. Whether you need a <a href="/services/virtual-executive-assistant">virtual executive assistant</a>, <a href="/services/sales-lead-generation">lead generation support</a>, <a href="/services/bookkeeping-accounting-support">bookkeeping support</a> or a complete remote team, we match you with professionals who work as part of your business.',
      'Unlike a freelancer marketplace, J Assist is a managed service: we match, coordinate and support your professional, and you interview them before they join. It is a practical alternative to traditional hiring for <a href="/industries/law-firms">law firms</a>, <a href="/industries/real-estate">real estate agents</a>, <a href="/industries/accounting-cpa-firms">accounting firms</a>, <a href="/industries/e-commerce">e-commerce stores</a> and <a href="/industries/startups-small-businesses">small businesses</a>.',
      'Explore <a href="/solutions">how it works</a>, learn <a href="/why-j-assist">why businesses choose managed virtual assistants</a>, or <a href="/contact">contact us</a> to build your team.'
    ]
  },
  services: {
    kicker: 'Our services', h2: 'Outsourced Business Support Across Nine Specialties',
    paras: [
      'J Assist offers outsourced business support in nine specialties: <a href="/services/virtual-executive-assistant">virtual executive assistant</a>, <a href="/services/social-media-management">social media management</a>, <a href="/services/website-development">website development</a>, <a href="/services/real-estate-support">real estate support</a>, <a href="/services/sales-lead-generation">sales and lead generation</a>, <a href="/services/content-creation">content creation</a>, <a href="/services/seo-management">SEO management</a>, <a href="/services/graphic-design">graphic design</a> and <a href="/services/bookkeeping-accounting-support">bookkeeping and accounting support</a>.',
      'Each service is delivered by a dedicated remote professional matched to your requirements. You can start with a single role and add more over time, building a complete remote team under one account manager.'
    ]
  },
  solutions: {
    kicker: 'Hiring made simple', h2: 'How to Hire a Virtual Assistant Without the Hiring Headaches',
    paras: [
      'Hiring a virtual assistant or remote professional can mean weeks of sourcing, screening and interviewing. J Assist simplifies it: you tell us what you need, we identify and match professionals to your requirements, and you review the profile and interview them before they start.',
      'Once your professional joins, managed support keeps things on track with coordination, performance monitoring and continuity if anything changes. See our <a href="/services">virtual assistant services</a> or read <a href="/blog/how-to-hire-a-virtual-assistant-step-by-step">our step-by-step guide to hiring a virtual assistant</a>.'
    ]
  },
  'why-j-assist': {
    kicker: 'Managed support', h2: 'Managed Virtual Assistants vs. Freelancers and In-House Hires',
    paras: [
      'Choosing between a freelancer, an in-house employee and a managed virtual assistant comes down to who handles the work around the work: recruiting, coordination, performance and continuity. With J Assist, that is included in a managed engagement.',
      'Read our comparison of <a href="/blog/virtual-assistant-vs-freelancer">virtual assistants and freelancers</a> and <a href="/blog/in-house-hire-vs-dedicated-remote-professional">in-house hires and dedicated remote professionals</a>, or <a href="/contact">talk to us</a> about the right structure for your business.'
    ]
  },
  industries: {
    kicker: 'Industry support', h2: 'Virtual Assistants for the Industries We Serve',
    paras: [
      'J Assist supports <a href="/industries/law-firms">law firms</a>, <a href="/industries/real-estate">real estate agents and brokerages</a>, <a href="/industries/accounting-cpa-firms">accounting and CPA firms</a>, <a href="/industries/e-commerce">e-commerce businesses</a>, <a href="/industries/professional-services">professional services firms</a> and <a href="/industries/startups-small-businesses">startups and small businesses</a>.',
      'Each industry page explains the tasks a virtual assistant can take on and the services that fit best. If your industry is not listed, <a href="/contact">contact us</a> and we will tell you whether we can help.'
    ]
  },
  about: {
    kicker: 'Our approach', h2: 'A Virtual Business Support Company Built Around Your Team',
    paras: [
      'J Assist is a virtual business support company that helps U.S. businesses access skilled remote professionals across business support, sales, marketing, finance, real estate and technology. Our goal is to give businesses reliable people they can depend on, without the complexity of traditional hiring.',
      'Learn about our <a href="/services">services</a>, our <a href="/solutions">process</a> and <a href="/why-j-assist">what makes J Assist different</a>, or <a href="/contact">get in touch</a>.'
    ]
  }
};

const BLOGS_EXTRA = [
  {
    slug: 'how-to-hire-a-virtual-assistant-step-by-step',
    title: 'How to Hire a Virtual Assistant: A Step-by-Step Guide',
    desc: 'A practical step-by-step guide to hiring a virtual assistant for your U.S. business, from defining tasks to interviewing and onboarding.',
    category: 'Hiring', date: '2026-10-13', read: '4 min read',
    body: [
      ['p', 'Hiring a virtual assistant can free up hours every week, but only if you set the engagement up properly. These steps apply whether you hire independently or through a managed provider such as J Assist.'],
      ['h2', '1. List the tasks you want to hand off'],
      ['p', 'Write down everything you did last week and mark what only you can do. Recurring work such as email, scheduling, data entry and follow-ups is the easiest to delegate.'],
      ['h2', '2. Define the role and hours'],
      ['p', 'Decide whether you need general administrative support or a specialist, such as a bookkeeper, a social media manager or a lead generation professional. Set expected working hours and time zone overlap with your U.S. team.'],
      ['h2', '3. Choose how you will hire'],
      ['p', 'You can recruit directly, use a marketplace or work with a managed provider that matches and supports the professional. Compare the effort each route needs from you. See our guide to <a href="/blog/virtual-assistant-vs-freelancer">virtual assistants vs. freelancers</a>.'],
      ['h2', '4. Interview before you commit'],
      ['p', 'Review the profile, ask about experience with your tools and run a short practical test of the work. With J Assist you interview the selected professional before moving forward.'],
      ['h2', '5. Document processes and onboard'],
      ['p', 'Share your tools, preferences and step-by-step instructions. Start with a few tasks, review the output and expand responsibilities as trust builds.'],
      ['p', 'Ready to start? Explore our <a href="/services">virtual assistant services</a> or <a href="/contact">contact us</a> to build your team.']
    ]
  },
  {
    slug: 'virtual-assistant-vs-freelancer',
    title: 'Virtual Assistant vs. Freelancer: Which Is Right for You?',
    desc: 'How a managed virtual assistant compares with a freelancer on matching, management, continuity and fit, and which suits your business.',
    category: 'Hiring', date: '2026-10-13', read: '3 min read',
    body: [
      ['p', 'Both freelancers and managed virtual assistants can take work off your plate. The difference lies in who handles the surrounding work: finding the person, managing them and covering gaps.'],
      ['h2', 'Where freelancers fit'],
      ['p', 'Freelancers can be a good fit for one-off projects with a clear scope, where you are comfortable sourcing, vetting and managing the work yourself.'],
      ['h2', 'Where a managed virtual assistant fits'],
      ['ul', ['Ongoing work that needs a dedicated person', 'Teams that want matching and coordination handled for them', 'Businesses that want continuity if something changes', 'Owners who want to scale from one role to a team']],
      ['h2', 'Questions to ask either way'],
      ['ul', ['Who is accountable for quality and performance?', 'What happens if the person becomes unavailable?', 'How easily can I add or change roles?', 'Will they work in my tools and hours?']],
      ['p', 'J Assist is a managed service, not a freelancer marketplace. Learn <a href="/why-j-assist">why businesses choose managed virtual assistants</a> or read our <a href="/blog/how-to-hire-a-virtual-assistant-step-by-step">step-by-step hiring guide</a>.']
    ]
  }
];

module.exports = { SERVICE_SEO, INDUSTRY_SEO, PAGE_COPY, BLOGS_EXTRA, COMMON };
