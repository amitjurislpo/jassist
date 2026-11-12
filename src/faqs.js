// Extra FAQs so every page has at least 6-7, all specific to that page.
// build.js appends these to the FAQs already defined in data.js / seo.js.
// Keep claims to what the site already states: no statistics, guarantees, named clients or invented credentials.

const base = ({ EMAIL, PHONE }) => ({
  // ---------- top-level pages ----------
  index: [
    ['What services does JurisAssistMe offer?', 'Nine specialties: virtual executive assistant, social media management, website development, real estate support, sales and lead generation, content creation, SEO management, graphic design, and bookkeeping and accounting support.'],
    ['How do I hire a virtual assistant through JurisAssistMe?', 'Tell us what you need, including tasks, responsibilities and preferred working hours. We match a professional to your requirements, you review the profile and interview them, and then they start.'],
    ['Do I interview the virtual assistant before they start?', 'Yes. You review the profile and interview the selected professional before moving forward.'],
    ['Can I start with one virtual assistant and add more later?', 'Yes. Start with one professional and expand into a complete remote support team as your needs grow.'],
    ['Who does JurisAssistMe work with?', 'We support U.S. businesses, including law firms, real estate agents and brokerages, accounting and CPA firms, e-commerce businesses, professional services firms, and startups and small businesses.'],
    ['How much does a virtual assistant cost?', 'Pricing is confirmed per engagement based on the roles, scope and hours you need. Contact us and we will recommend a team structure and quote.']
  ],
  services: [
    ['What virtual assistant services does JurisAssistMe provide?', 'Virtual executive assistant, social media management, website development, real estate support, sales and lead generation, content creation, SEO management, graphic design, and bookkeeping and accounting support.'],
    ['How do I choose the right service for my business?', 'Start with the work that takes the most of your time or is most repetitive. Tell us what you want to hand off and we will recommend the role or combination of roles that fits.'],
    ['Which tools does my professional work in?', 'Your professional works in your systems, on your schedule and following your processes. We confirm tools, time zone and working hours during setup.'],
    ['Are the services for U.S. businesses only?', 'Our services are designed for U.S. businesses, with support across Eastern, Central, Mountain and Pacific time and flexible working hours.'],
    ['Can I hire for a role that is not listed?', 'Contact us with what you need. We will tell you whether we are a fit and how we would structure the support.']
  ],
  solutions: [
    ['How does JurisAssistMe work?', 'It is a four-step process: tell us what you need, get matched with a professional, interview them, and start growing with a dedicated team member.'],
    ['What do I need to prepare before getting in touch?', 'The roles you need, your preferred working hours and time zone, and the tools your team already uses. Rough is fine; we will refine it together.'],
    ['Who selects the virtual assistant?', 'We identify and match professionals based on your requirements. You then review the profile and interview the selected professional before moving forward.'],
    ['How quickly can my virtual assistant start?', 'Timing depends on the role and your requirements. We will give you an estimate once we understand what you need.'],
    ['What support do I get after my professional starts?', 'Managed support includes coordination, performance monitoring and continuity, so you are not managing everything alone.'],
    ['Can I add or change roles later?', 'Yes. Flexible scaling lets you add professionals, adjust hours or change the mix of roles as your business changes.']
  ],
  'why-jurisassistme': [
    ['Is JurisAssistMe a freelancer marketplace?', 'No. We match, manage and support professionals who work as part of your team, with coordination, performance monitoring and continuity handled for you.'],
    ['What does managed support include?', 'Matching, coordination, performance monitoring, operational support and continuity if something changes.'],
    ['What is the difference between a managed virtual assistant and an in-house employee?', 'An in-house hire means you handle recruiting, training, administration and replacement. With a managed virtual assistant, much of that work is handled as part of the engagement.'],
    ['What happens if my virtual assistant is unavailable?', 'Continuity is part of our managed support, so your work does not stop if something changes.'],
    ['Do I still have control over my professional\'s work?', 'Yes. Your professional works in your systems, follows your processes and works on the schedule you agree.'],
    ['How is pricing handled compared with other options?', 'Pricing is confirmed per engagement based on the roles and hours you need. The comparison on this page is an illustration only.']
  ],
  industries: [
    ['Which industries does JurisAssistMe support?', 'Law firms, real estate, accounting and CPA firms, e-commerce, professional services, and startups and small businesses.'],
    ['Do virtual assistants understand my industry\'s terminology?', 'We match professionals to your requirements, including your industry and tools. You review the profile and interview them before they start.'],
    ['Does JurisAssistMe give legal, tax or financial advice?', 'No. We provide administrative and business support only. JurisAssistMe is not a law, CPA or financial advisory firm.'],
    ['Can I use different roles across one business?', 'Yes. Many businesses combine roles, such as an executive assistant with bookkeeping or lead generation support.'],
    ['What if my industry is not listed?', 'Contact us. We will tell you whether we are a fit and which roles could help.']
  ],
  about: [
    ['Who is JurisAssistMe for?', 'U.S. businesses that want skilled virtual professionals without the complexity of traditional hiring, from solo founders to growing teams.'],
    ['What makes JurisAssistMe different?', 'We are a managed service rather than a marketplace. We match, manage and support professionals so they work as part of your team.'],
    ['What areas can your professionals support?', 'Business support, sales, marketing, finance, real estate and technology.'],
    ['How does the account manager fit in?', 'One account manager coordinates your team, so you have a single point of contact.'],
    ['Where is JurisAssistMe\'s team based?', 'Our professionals work remotely and support U.S. businesses across Eastern, Central, Mountain and Pacific time.'],
    ['How do I get in touch?', `Email ${EMAIL} or call ${PHONE}. You can also use the contact page.`]
  ],
  contact: [
    ['How do I contact JurisAssistMe?', `Email ${EMAIL} or call ${PHONE}.`],
    ['How soon will I hear back?', 'We aim to respond promptly during our phone hours, Monday to Friday, 9 AM to 6 PM.'],
    ['Do I have to commit when I get in touch?', 'No. Contacting us is a conversation about what you need. You interview the selected professional before moving forward.'],
    ['What will you ask me during the first conversation?', 'About your tasks and responsibilities, preferred working hours, time zone and the tools your team uses.'],
    ['Can I ask about pricing?', 'Yes. Pricing is confirmed per engagement based on the scope, role and hours you need, and we will recommend a structure and quote.'],
    ['Can I hire more than one professional?', 'Yes. You can start with one role and build a complete remote support team over time.']
  ],

  blog: [
    ['What topics does the JurisAssistMe blog cover?', 'Practical guidance on hiring virtual assistants, delegating work and running a lean remote team for U.S. businesses.'],
    ['Who is the blog written for?', 'Business owners, executives and teams considering a virtual assistant or remote professionals.'],
    ['Is the blog content professional advice?', 'No. Articles are general information, not legal, tax, accounting or financial advice.'],
    ['How do I know which article to start with?', 'If you are new to virtual assistants, start with our step-by-step guide to hiring one.'],
    ['Can I suggest a topic for the blog?', 'Yes. Contact us with the topic you would like us to cover.'],
    ['Where can I learn about your services?', 'See our services page for all nine specialties, or contact us to talk through what you need.']
  ],
  resources: [
    ['What is on the Resources page?', 'Guides and insights on hiring and working with virtual assistants, plus case studies that will be published once approved.'],
    ['Where can I read your articles?', 'On the JurisAssistMe blog, which includes a step-by-step guide to hiring a virtual assistant.'],
    ['Are case studies available yet?', 'Not yet. They are coming soon and will be published once approved.'],
    ['Are the resources free to read?', 'Yes. Our articles are free to read on the site.'],
    ['Is the information on this site professional advice?', 'No. It is general information. JurisAssistMe is not a law, CPA or financial advisory firm.'],
    ['How can I talk to someone about my needs?', 'Use the contact page to email or call us and we will recommend a team structure for your business.']
  ],

  // ---------- services ----------
  'services/virtual-executive-assistant': [
    ['What tasks can a virtual executive assistant handle?', 'Calendar management, email management, scheduling, research, travel coordination, reporting and administrative support.'],
    ['Will my assistant work in my calendar and inbox?', 'Yes. Your assistant works in your tools and systems. Access and permissions are confirmed during setup.'],
    ['Can I limit what my virtual executive assistant can do?', 'Yes. You define the tasks and approvals, and sensitive decisions can stay with you.']
  ],
  'services/social-media-management': [
    ['What does a social media manager do?', 'Content planning, scheduling, publishing, community management, analytics and general social media support.'],
    ['Which platforms can you manage?', 'We confirm the platforms you use during setup and plan the work around them.'],
    ['Will I see how my social media is performing?', 'Analytics and reporting are part of the service, so you can see what has been published and how it performed.']
  ],
  'services/website-development': [
    ['What website work can you help with?', 'Business websites, landing pages, WordPress development, maintenance, updates and technical support.'],
    ['Can you update or maintain my existing website?', 'Yes. Maintenance, updates and technical support are part of the service.'],
    ['Do you work with WordPress?', 'Yes. WordPress development is included.']
  ],
  'services/real-estate-support': [
    ['What does a real estate virtual assistant do?', 'Property research, lead management, CRM updates, listing support, appointment scheduling and administrative assistance.'],
    ['Can the assistant update my CRM?', 'Yes. CRM updates are part of the service, and we confirm your CRM during setup.'],
    ['Is this suitable for both agents and brokerages?', 'Yes. We support individual agents and brokerages.'],
    ['Can the assistant help with listing support?', 'Yes. Listing support is part of the service, alongside property research and appointment scheduling.']
  ],
  'services/sales-lead-generation': [
    ['What is included in sales and lead generation support?', 'Lead research, prospecting, cold calling, email outreach, appointment setting, CRM management and follow-ups.'],
    ['Will the assistant book appointments for my team?', 'Yes. Appointment setting is part of the service.'],
    ['Can you manage follow-ups in my CRM?', 'Yes. CRM management and follow-ups are included, working in your CRM.']
  ],
  'services/content-creation': [
    ['What types of content can you create?', 'Blogs, website content, social media content, email content, marketing copy and business communications.'],
    ['Will the content match my brand voice?', 'Your professional writes in your voice, following the guidance and examples you provide.'],
    ['Do I review content before it is published?', 'Yes. You set the approval process and keep control over what goes live.'],
    ['Can the writer create content for email and social media as well as blogs?', 'Yes. Blogs, website content, social media content, email content and marketing copy are all included.'],
    ['How is content planned and delivered?', 'We agree the topics, formats and schedule with you during setup, and your professional delivers on that plan for your review.']
  ],
  'services/seo-management': [
    ['How long does SEO take to show results?', 'SEO is a long-term effort and timing varies by site and market, so we do not promise specific timelines or rankings.'],
    ['Do you provide SEO reports?', 'Yes. Reporting is part of the service, with regular updates on work completed.'],
    ['Can SEO work alongside content and website support?', 'Yes. Your SEO specialist can work with content and website support to improve how your business appears in search.']
  ],
  'services/graphic-design': [
    ['What design work can you do?', 'Social media creatives, presentations, advertisements, brochures, marketing materials and business graphics.'],
    ['Can the designer follow my brand guidelines?', 'Yes. Share your brand guidelines and examples and the designer works within them.'],
    ['Can I get regular design support rather than one-off projects?', 'Yes. You can have ongoing design support from a dedicated professional.']
  ],
  'services/bookkeeping-accounting-support': [
    ['What bookkeeping tasks can be delegated?', 'Bookkeeping, accounts payable, accounts receivable, invoice management, expense tracking, accounting data entry and QuickBooks support.'],
    ['Will the assistant work in QuickBooks?', 'QuickBooks support is available, and we confirm other tools during setup.'],
    ['Do I keep approval of payments and entries?', 'Yes. Your professional follows your approval steps, and decisions stay with you or your accountant.']
  ],

  // ---------- industries ----------
  'industries/law-firms': [
    ['What can a virtual assistant do for a law firm?', 'Client intake, scheduling, document formatting, billing support and client follow-ups.'],
    ['Can the assistant work in my practice-management software?', 'Yes. Your professional works in your tools under your supervision, and we confirm the tools during setup.'],
    ['Does the assistant give legal advice?', 'No. Support is administrative only. Assistants do not give legal advice or act as legal representatives.'],
    ['How is client information handled?', 'Your professional follows your procedures and works in your systems. Access and working practices are agreed during setup.']
  ],
  'industries/real-estate': [
    ['What can a virtual assistant do for real estate agents?', 'Listing coordination, CRM updates, lead follow-up, showing schedules and transaction paperwork.'],
    ['Can the assistant follow up with new leads?', 'Yes. Lead follow-up is part of the support.'],
    ['Is this suitable for brokerages as well as individual agents?', 'Yes. We support agents and brokerages.'],
    ['Which CRM can the assistant use?', 'We confirm your CRM and other tools during setup.']
  ],
  'industries/accounting-cpa-firms': [
    ['What can a virtual assistant do for an accounting firm?', 'Bookkeeping, accounts payable and receivable, reconciliations, accounting data entry and QuickBooks support.'],
    ['Can support scale with busy seasons?', 'Yes. Flexible scaling lets you add support during busy periods and adjust afterwards.'],
    ['Will the assistant follow my firm\'s review steps?', 'Yes. Your professional follows your procedures and review steps.'],
    ['Does JurisAssistMe replace my staff accountants?', 'No. It provides administrative and bookkeeping support that frees your team for advisory and review work.']
  ],
  'industries/e-commerce': [
    ['What can an e-commerce virtual assistant do?', 'Store operations, product listings, customer email, social content and order support.'],
    ['Can the assistant manage product listings?', 'Yes. Product listings are part of the support.'],
    ['Can I handle seasonal peaks with extra support?', 'Yes. Flexible scaling lets you add professionals when workload peaks.'],
    ['Which store platforms can the assistant use?', 'We confirm your platform and tools during setup.']
  ],
  'industries/professional-services': [
    ['What can a virtual assistant do for a consultancy or agency?', 'Executive assistance, proposal support, reporting and client communication.'],
    ['Can the assistant help with proposals?', 'Yes. Proposal support is part of the service.'],
    ['Can the assistant communicate with my clients?', 'Client communication support is included. You decide what is sent directly and what you approve first.'],
    ['Can I add roles as my firm grows?', 'Yes. Start with one assistant and add specialists as the workload grows.']
  ],
  'industries/startups-small-businesses': [
    ['Why would a startup use a virtual assistant?', 'To get skilled support for admin, sales, marketing and operations without building HR and a full in-house team.'],
    ['Can I start small with a single assistant?', 'Yes. Begin with one virtual assistant and add specialists as you grow.'],
    ['Can one assistant cover multiple tasks?', 'Yes. Many small businesses start with a general role and add specialists later.'],
    ['What do I need to get started?', 'A list of the tasks you want to hand off, your preferred working hours and the tools you use.']
  ]
});

// One more per page so every page lands on exactly 8 (build.js caps at 8).
const MORE = {
  blog: [
    ['How often is the blog updated?', 'We publish new guides as they are ready. Check back or contact us to ask about a topic.'],
    ['Can I share an article with my team?', 'Yes. Use the share buttons on each article to send it by social media, WhatsApp or email.']
  ],
  resources: [
    ['Can I share these resources with my team?', 'Yes. Articles include share buttons for social media, WhatsApp and email.'],
    ['Where can I find the services JurisAssistMe offers?', 'On the services page, which covers all nine specialties.']
  ],
  industries: [
    ['How do I find the right virtual assistant for my industry?', 'Tell us your industry, tasks and tools. We match a professional to your requirements and you interview them first.']
  ],
  'industries/law-firms': [['Can I start with a few hours of support?', 'Yes. Start with the hours your tasks need and adjust as you see how it works.']],
  'industries/real-estate': [['Can the assistant support me during busy listing periods?', 'Yes. Flexible scaling lets you add support when workload peaks.']],
  'industries/accounting-cpa-firms': [['Can I hire support just for tax season?', 'Flexible scaling lets you add professionals for busy periods and adjust afterwards. Contact us to plan the structure.']],
  'industries/e-commerce': [['Can the assistant help with customer email?', 'Yes. Customer email is part of the e-commerce support.']],
  'industries/professional-services': [['Can the assistant produce client reports?', 'Yes. Reporting support is included.']],
  'industries/startups-small-businesses': [['Do I need a long-term contract to start?', 'Terms are confirmed per engagement. Contact us and we will explain the options.']],
  'services/virtual-executive-assistant': [['Can I add more support roles later?', 'Yes. Many businesses add roles such as bookkeeping or lead generation support alongside an executive assistant.']],
  'services/social-media-management': [['Can I approve posts before they are published?', 'Yes. You set the approval process and keep control of what goes live.']],
  'services/website-development': [['Can you build landing pages for campaigns?', 'Yes. Landing pages are part of the service.']],
  'services/real-estate-support': [['How is the service priced?', 'Pricing is confirmed per engagement based on the scope, role and hours you need.']],
  'services/sales-lead-generation': [['Can the assistant do cold calling and email outreach?', 'Yes. Both are part of the service.']],
  'services/content-creation': [['How is the service priced?', 'Pricing is confirmed per engagement based on the scope, role and hours you need.']],
  'services/seo-management': [['Does SEO include competitor research?', 'Yes. Competitor research is part of the service.']],
  'services/graphic-design': [['Can the designer create social media graphics?', 'Yes. Social media creatives are included.']],
  'services/bookkeeping-accounting-support': [['Is this tax or audit advice?', 'No. This is bookkeeping and administrative support, and JurisAssistMe is not a CPA firm. Speak to your accountant or CPA for tax and audit advice.']]
};

module.exports = ctx => {
  const f = base(ctx);
  for (const k in MORE) f[k] = [...(f[k] || []), ...MORE[k]];
  return f;
};
