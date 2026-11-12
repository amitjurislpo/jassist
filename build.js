// Static page generator: wraps page fragments (src/pages/*.html plus generated service/blog pages)
// with the shared header/footer and writes them to public/. Run with `npm run build`.
// Set SITE_URL to also emit canonical tags, sitemap.xml and robots.txt.
const fs = require('fs');
const path = require('path');
const { SERVICES, PAGE_FAQS } = require('./src/data');
const { BLOGS } = require('./src/blogs');
const { TEAM } = require('./src/team');
const { SERVICE_SEO, INDUSTRY_SEO, PAGE_COPY } = require('./src/seo');

const SRC = path.join(__dirname, 'src', 'pages');
const OUT = path.join(__dirname, 'public');
const SITE_URL = (process.env.SITE_URL || 'https://jurisassistme.com').replace(/\/$/, '');

const EMAIL = 'contact@jurisassistme.com';
const PHONE_DISPLAY = '+1 (646) 233-8454';
const PHONE_HREF = 'tel:+16462338454';
const FAQ_COUNT = 6; // every page with an FAQ section shows exactly this many
const EXTRA_FAQS = require('./src/faqs')({ EMAIL, PHONE: PHONE_DISPLAY });

const arrow = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
const back = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>';
const check = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const esc = t => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

const NAV = [
  ['services', '/services', 'Services'],
  ['solutions', '/solutions', 'Solutions'],
  ['why-jurisassistme', '/why-jurisassistme', 'Why JurisAssistMe'],
  ['industries', '/industries', 'Industries'],
  ['about', '/about', 'About Us'],
  ['blog', '/blog', 'Blog']
];

const STATIC = [
  { slug: 'index', nav: null, url: '/', title: 'JurisAssistMe | Your Trusted Virtual Assistance Partner', desc: 'JurisAssistMe provides dedicated virtual assistants and managed remote teams for U.S. businesses: executive assistants, sales, marketing, bookkeeping and more.' },
  { slug: 'services', nav: 'services', url: '/services', title: 'Virtual Assistant & Remote Support Services | JurisAssistMe', desc: 'Eight specialties: virtual executive assistant, administrative support, social media, website development, content, SEO, design and bookkeeping.' },
  { slug: 'solutions', nav: 'solutions', url: '/solutions', title: 'How to Hire a Virtual Assistant: Our 4-Step Process | JurisAssistMe', desc: 'Tell us what you need, get matched, interview your virtual assistant and start growing. See how JurisAssistMe builds your remote team.' },
  { slug: 'why-jurisassistme', nav: 'why-jurisassistme', url: '/why-jurisassistme', title: 'Managed Virtual Assistants vs. Freelancers | JurisAssistMe', desc: 'JurisAssistMe is not a freelancer marketplace. We match, manage and support dedicated virtual professionals who work as part of your team.' },
  { slug: 'industries', nav: 'industries', url: '/industries', title: 'Virtual Assistants for Law Firms, Real Estate & More', desc: 'Virtual assistant support for law firms, real estate, accounting and CPA firms, e-commerce, professional services, startups and small businesses.' },
  { slug: 'about', nav: 'about', url: '/about', title: 'About JurisAssistMe | Virtual Business Support Company', desc: 'JurisAssistMe helps U.S. businesses access reliable, skilled virtual professionals without the complexity of traditional hiring.' },
  { slug: 'resources', nav: 'resources', url: '/resources', title: 'Resources: Guides & Case Studies | JurisAssistMe', desc: 'Guides on hiring and working with virtual assistants, plus upcoming case studies from JurisAssistMe.' },
  { slug: 'contact', nav: null, url: '/contact', title: 'Contact JurisAssistMe | Hire a Virtual Assistant Team', desc: `Email ${EMAIL} or call ${PHONE_DISPLAY} to build your virtual assistant team with JurisAssistMe.` },
  { slug: 'privacy-policy', nav: null, noindex: true, url: '/privacy-policy', title: 'Privacy Policy | JurisAssistMe', desc: 'JurisAssistMe privacy policy.' },
  { slug: 'terms-of-service', nav: null, noindex: true, url: '/terms-of-service', title: 'Terms of Service | JurisAssistMe', desc: 'JurisAssistMe terms of service.' }
];

const logo = '<a href="/" class="logo" aria-label="JurisAssistMe home"><span class="mk">J</span><span class="as">Juris<b>Assist</b><em>Me</em></span></a>';

function header(active) {
  const menus = {
    services: SERVICES.map(s => [`/services/${s.slug}`, s.name]),
    industries: INDUSTRY_SEO.map(d => [`/industries/${d.slug}`, d.name])
  };
  const link = ([k, href, label]) => `<a href="${href}"${k === active ? ' aria-current="page"' : ''}>${label}</a>`;
  const links = NAV.map(link).join('');
  const navDesktop = NAV.map(n => menus[n[0]]
    ? `<div class="dd">${link(n).replace('<a ', '<a aria-haspopup="true" ')}<div class="dd-menu"><div class="dd-in">${menus[n[0]].map(([h, t]) => `<a href="${h}">${esc(t)}</a>`).join('')}<a href="${n[1]}" class="dd-all">View all ${n[2].toLowerCase()} ${arrow}</a></div></div></div>`
    : link(n)).join('');
  return `<a class="skip" href="#main">Skip to content</a>

<header class="hdr">
  ${logo}
  <nav class="nav" aria-label="Main">${navDesktop}</nav>
  <div class="hr">
    <a href="/contact" class="btn btn-gold">Get Started ${arrow}</a>
    <button class="burger" aria-label="Open menu" aria-expanded="false"><span></span><span></span></button>
  </div>
</header>

<nav class="mnav" aria-label="Mobile">
  ${links}
  <a href="/contact" class="btn btn-dark">Get Started</a>
</nav>`;
}

const social = `<div class="soc">
        <a href="/contact" aria-label="LinkedIn"><svg viewBox="0 0 24 24"><path d="M4.98 3.5a2.5 2.5 0 11-.01 5 2.5 2.5 0 01.01-5zM3 9.75h4v11H3zM9.5 9.75h3.8v1.5h.05c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.78 2.65 4.78 6.1v5.45h-4v-4.83c0-1.15-.02-2.63-1.6-2.63-1.6 0-1.85 1.25-1.85 2.55v4.91h-4z"/></svg></a>
        <a href="/contact" aria-label="Instagram"><svg viewBox="0 0 24 24"><path d="M12 7.3A4.7 4.7 0 1012 16.7 4.7 4.7 0 0012 7.3zm0 7.75A3.05 3.05 0 1112 8.95a3.05 3.05 0 010 6.1zM17 5.9a1.1 1.1 0 100 2.2 1.1 1.1 0 000-2.2zM21.9 7.9c-.06-1.5-.4-2.83-1.5-3.92S18 2.55 16.5 2.48C14.94 2.4 9.06 2.4 7.5 2.48 6 2.55 4.68 2.9 3.58 3.98S2.15 6.4 2.08 7.9c-.09 1.56-.09 6.64 0 8.2.07 1.5.4 2.83 1.5 3.92s2.42 1.43 3.92 1.5c1.56.09 7.44.09 9 0 1.5-.07 2.83-.4 3.92-1.5s1.43-2.42 1.5-3.92c.09-1.56.09-6.64-.02-8.2zm-2 9.88a3.2 3.2 0 01-1.8 1.8c-1.25.5-4.2.38-5.6.38s-4.36.11-5.6-.38a3.2 3.2 0 01-1.8-1.8c-.5-1.25-.38-4.2-.38-5.6s-.11-4.36.38-5.6a3.2 3.2 0 011.8-1.8c1.25-.5 4.2-.38 5.6-.38s4.36-.11 5.6.38a3.2 3.2 0 011.8 1.8c.5 1.25.38 4.2.38 5.6s.12 4.36-.38 5.6z"/></svg></a>
        <a href="/contact" aria-label="Facebook"><svg viewBox="0 0 24 24"><path d="M14 8.5V6.7c0-.8.2-1.2 1.4-1.2H17V2.3c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3v2H7.5v3.4h2.8v9.9H14v-9.9h2.8l.4-3.4z"/></svg></a>
      </div>`;

const DISCLAIMER = 'JurisAssistMe provides virtual business support and is not a law, CPA or financial advisory firm. Website content is general information, not professional advice, and profiles, statistics and logos shown are illustrative.';

const svcLinks = SERVICES.map(s => `<li><a href="/services/${s.slug}">${esc(s.name)}</a></li>`).join('');

function footer() {
  return `<footer class="ftr">
  <div class="wrap">
    <div class="f-top">
      <div class="f-brand">
        ${logo}
        <p><b>Your Trusted Virtual Assistance Partner.</b><br>Dedicated virtual professionals for U.S. businesses.</p>
      </div>
      <div><h4>Company</h4><ul><li><a href="/about">About</a></li><li><a href="/why-jurisassistme">Why JurisAssistMe</a></li><li><a href="/solutions">How It Works</a></li><li><a href="/contact">Contact</a></li></ul></div>
      <div class="f-svc"><h4>Services</h4><ul>${svcLinks}</ul></div>
      <div><h4>Resources</h4><ul><li><a href="/blog">Blog</a></li><li><a href="/resources#case-studies">Case Studies</a></li></ul></div>
    </div>
    <div class="f-bot">
      <span>© 2026 JurisAssistMe. All Rights Reserved.</span>
      <div class="lg2"><a href="/privacy-policy">Privacy Policy</a><a href="/terms-of-service">Terms of Service</a></div>
      ${social}
    </div>
    <p class="disc"><b>Disclaimer:</b> ${DISCLAIMER}</p>
  </div>
</footer>`;
}

function faqSection(faqs) {
  if (!faqs || !faqs.length) return { html: '', ld: '' };
  const html = `<!-- ============ FAQ ============ -->
<section class="faqs" aria-labelledby="fq-h">
  <div class="wrap">
    <div class="faq-panel">
    <div class="sec-head rv"><span class="kicker"><b>FAQs</b> Quick answers</span><h2 class="h2" id="fq-h">Frequently Asked <span class="gg-d">Questions</span></h2></div>
    <div class="fx rv" data-fx>
      <ol class="fx-list" role="tablist" aria-label="Frequently asked questions">
${faqs.map(([q, a], i) => `        <li class="fx-item${i === 0 ? ' on' : ''}"><button type="button" role="tab" id="fxt-${i}" aria-controls="fx-panel" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}"><span class="fx-n">${String(i + 1).padStart(2, '0')}</span><span class="fx-t">${esc(q)}</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg></button><div class="fx-ans"><p>${a}</p></div></li>`).join('')}
      </ol>
      <div class="fx-stage"><span class="fx-arc a1" aria-hidden="true"></span><span class="fx-arc a2" aria-hidden="true"></span>
      <div class="fx-panel" id="fx-panel" role="tabpanel" aria-live="polite">
        <span class="fx-spark s1" aria-hidden="true"></span><span class="fx-spark s2" aria-hidden="true"></span><span class="fx-spark s3" aria-hidden="true"></span>
        <span class="fx-bg" aria-hidden="true">01</span>
        <span class="fx-eyebrow">Question <b>01</b></span>
        <div class="fx-body"><h3 class="fx-q"></h3><div class="fx-a"></div></div>
        <div class="fx-foot">
          <span class="fx-count"><b>01</b> / ${String(faqs.length).padStart(2, '0')}</span>
          <span class="fx-bars" aria-hidden="true">${faqs.map((_, i) => `<i${i === 0 ? ' class="on"' : ''}></i>`).join('')}</span>
          <span class="fx-nav"><button type="button" class="fx-prev" aria-label="Previous question">{{back}}</button><button type="button" class="fx-next" aria-label="Next question">{{arrow}}</button></span>
        </div>
      </div>
      </div>
    </div>
    </div>
  </div>
</section>
`;
  const ld = `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faqs.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a.replace(/<[^>]+>/g, '') } })) })}</script>`;
  return { html, ld };
}

const CTA_MARK = '<!-- ============ CTA';
const ctaBlock = `<!-- ============ CTA ============ -->
<section class="cta" aria-labelledby="ct-h">
  <div class="wrap">
    <div class="cta-border rv">
      <div class="cta-in">
        <span class="pill"><b>START</b> Let's talk</span>
        <h2 class="h2" id="ct-h">Ready to Build Your <span class="gg">Remote Team?</span></h2>
        <p>Tell us what you need. We'll help you find the right people to get it done.</p>
        <div class="hero-ctas">
          <a href="/contact" class="btn btn-gold">Get Started {{arrow}}</a>
          <a href="/contact" class="btn btn-ghost-w">Talk to Our Team</a>
        </div>
      </div>
    </div>
  </div>
</section>
`;

function seoCopy(slug) {
  const c = PAGE_COPY[slug];
  if (!c) return '';
  return `<!-- ============ SEO COPY ============ -->
<section class="seo-copy" aria-labelledby="sc-h">
  <div class="wrap">
    <div class="seo-in rv">
      <span class="kicker"><b>${esc(c.kicker)}</b></span>
      <h2 class="h2" id="sc-h">${c.h2}</h2>
      ${c.paras.map(p => `<p>${p}</p>`).join('\n      ')}
    </div>
  </div>
</section>
`;
}

const CRUMB = { services: 'Services', solutions: 'Solutions', 'why-jurisassistme': 'Why JurisAssistMe', industries: 'Industries', about: 'About Us', resources: 'Resources', contact: 'Contact', blog: 'Blog' };
const absolute = u => SITE_URL + u;
function breadcrumbLd(page) {
  if (!SITE_URL || !page.crumbs) return '';
  const items = [['Home', '/'], ...page.crumbs].map(([name, url], i) => ({ '@type': 'ListItem', position: i + 1, name, item: absolute(url) }));
  return `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: items })}</script>`;
}
const PHONE_E164 = '+1-646-233-8454';
const orgLd = `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@type': 'Organization', name: 'JurisAssistMe', alternateName: 'Your Trusted Virtual Assistance Partner', logo: SITE_URL + '/logo.svg', description: 'Virtual business support and dedicated remote teams for U.S. businesses.', email: EMAIL, telephone: PHONE_E164, ...(SITE_URL ? { url: SITE_URL } : {}), contactPoint: { '@type': 'ContactPoint', contactType: 'customer support', email: EMAIL, telephone: PHONE_E164, areaServed: 'US', availableLanguage: 'English' } })}</script>`;

const FAVICON = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="#D8C08A"/><text x="16" y="23" font-family="Georgia,serif" font-size="20" font-weight="700" text-anchor="middle" fill="#111">J</text></svg>');

function render(page, body) {
  const extra = EXTRA_FAQS[page.slug] || [];
  const seen = new Set((page.faqs || []).map(f => f[0].toLowerCase()));
  const faq = faqSection([...(page.faqs || []), ...extra.filter(f => !seen.has(f[0].toLowerCase()))].slice(0, FAQ_COUNT));
  const copy = seoCopy(page.slug);
  if (copy) body = body.includes(CTA_MARK) ? body.replace(CTA_MARK, copy + '\n' + CTA_MARK) : body + '\n' + copy;

  // FAQ goes just before the closing CTA (or at the end when the page has none).
  if (faq.html) body = body.includes(CTA_MARK) ? body.replace(CTA_MARK, faq.html + '\n' + CTA_MARK) : body + '\n' + faq.html;
  const canon = SITE_URL ? `\n<link rel="canonical" href="${SITE_URL}${page.url}">` : '';
  const noindex = page.noindex ? '\n<meta name="robots" content="noindex">' : '';
  const ld = [page.slug === 'index' ? orgLd : '', faq.ld, page.ld, breadcrumbLd(page)].filter(Boolean).join('\n');
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(page.title)}</title>
<meta name="description" content="${esc(page.desc)}">${canon}${noindex}
<meta property="og:title" content="${esc(page.title)}">
<meta property="og:description" content="${esc(page.desc)}">
<meta property="og:type" content="${page.ogType || 'website'}">
<meta property="og:site_name" content="JurisAssistMe">
<meta name="application-name" content="JurisAssistMe">
${page.keywords ? `<meta name="keywords" content="${esc(page.keywords.join(', '))}">\n` : ''}${page.image ? `<meta property="og:image" content="${absolute(page.image)}">\n<meta property="article:published_time" content="${page.published}">\n<meta name="twitter:image" content="${absolute(page.image)}">\n` : ''}<meta name="twitter:card" content="${page.image ? 'summary_large_image' : 'summary'}">
<meta name="theme-color" content="#111111">
<link rel="icon" href="${FAVICON}">
<link rel="preload" href="/fonts/bodoni-moda.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/fonts/jost.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/css/styles.css">
${ld}
</head>
<body>
${header(page.nav)}

<main id="main">
${body}
</main>

${footer()}

<script src="/js/main.js"></script>
</body>
</html>
`;
}

function fill(s) {
  return s
    .replace(/\{\{team\}\}/g, () => teamSection())
    .replace(/\{\{arrow\}\}/g, arrow)
    .replace(/\{\{back\}\}/g, back)
    .replace(/\{\{check\}\}/g, check)
    .replace(/\{\{email\}\}/g, EMAIL)
    .replace(/\{\{phone\}\}/g, PHONE_DISPLAY)
    .replace(/\{\{phonehref\}\}/g, PHONE_HREF);
}

// ---- Shared page pieces ----
const stepsBlock = (title, kicker) => `<section class="sv-how" aria-labelledby="sh-h">
  <div class="wrap">
    <div class="sec-head rv"><span class="kicker"><b>Process</b> ${kicker}</span><h2 class="h2" id="sh-h">${title}</h2></div>
    <div class="sv-steps">
      <div class="rv"><span>01</span><h3>Tell us what you need</h3><p>Share your requirements, responsibilities and preferred working hours.</p></div>
      <div class="rv d1"><span>02</span><h3>Meet your professional</h3><p>We match a professional to your needs. You review the profile and interview them first.</p></div>
      <div class="rv d2"><span>03</span><h3>Start growing</h3><p>Your dedicated professional becomes an extension of your team. <a href="/solutions">See the full process</a>.</p></div>
    </div>
  </div>
</section>`;

const serviceCards = list => list.map(r => `<a href="/services/${r.slug}" class="rel-card rv"><h3>${esc(r.name)}</h3><p>${esc(r.desc)}</p><span class="more">Learn More {{arrow}}</span></a>`).join('');

// ---- Service detail pages ----
function servicePage(s, i) {
  const seo = SERVICE_SEO[s.slug];
  // Link to the next three services so every page gets internal links in and out.
  const related = [1, 2, 3].map(n => SERVICES[(i + n) % SERVICES.length]);
  const body = `<section class="sv first" aria-labelledby="sd-h">
  <div class="wrap sv-in">
    <div class="rv">
      <nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a><span>/</span><a href="/services">Services</a><span>/</span><span aria-current="page">${esc(s.name)}</span></nav>
      <span class="kicker"><b>Service</b> ${String(i + 1).padStart(2, '0')} / ${String(SERVICES.length).padStart(2, '0')}</span>
      <h1 class="h2" id="sd-h">${esc(seo.h1)}</h1>
      <p class="lead">${esc(seo.p1)}</p>
      <div class="hero-ctas left"><a href="/contact" class="btn btn-dark">Get Started {{arrow}}</a><a href="/services" class="btn btn-line">All Services</a></div>
    </div>
    <div class="inc rv d1">
      <h2>What's included</h2>
      <ul>${s.items.map(t => `<li><span class="c">{{check}}</span>${esc(t)}</li>`).join('')}</ul>
    </div>
  </div>
</section>

<section class="sv-about" aria-labelledby="sa-h">
  <div class="wrap">
    <div class="sv-about-in rv">
      <h2 class="h2" id="sa-h">Why choose JurisAssistMe for ${esc(seo.kw)}?</h2>
      <p>${esc(seo.p2)}</p>
      <h3>Best suited for</h3>
      <div class="tags-l">${seo.best.map(b => `<span>${esc(b)}</span>`).join('')}</div>
    </div>
    <div class="ben-grid">${seo.benefits.map(([t, d], n) => `<div class="ben rv${n ? ' d' + Math.min(n, 3) : ''}"><h3>${esc(t)}</h3><p>${esc(d)}</p></div>`).join('')}</div>
  </div>
</section>

${stepsBlock(`How our ${esc(seo.kw)} service <span class="gg-d">works.</span>`, '3 simple steps')}

<section class="rel" aria-labelledby="rl-h">
  <div class="wrap">
    <h2 class="h2" id="rl-h">Related <span class="gg-d">services</span></h2>
    <div class="rel-grid">${serviceCards(related)}</div>
  </div>
</section>

${ctaBlock}`;
  return {
    slug: 'services/' + s.slug, nav: 'services', url: '/services/' + s.slug,
    title: seo.title, desc: seo.meta, faqs: seo.faqs, body,
    crumbs: [['Services', '/services'], [s.name, '/services/' + s.slug]],
    ld: `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@type': 'Service', name: s.name, serviceType: seo.kw, description: seo.meta, provider: { '@type': 'Organization', name: 'JurisAssistMe' }, areaServed: { '@type': 'Country', name: 'United States' } })}</script>`
  };
}

// ---- Industry pages ----
function industryPage(d, i) {
  const svcs = d.services.slice(0, 3).map(sl => SERVICES.find(x => x.slug === sl));
  const body = `<section class="sv first" aria-labelledby="id-h">
  <div class="wrap sv-in">
    <div class="rv">
      <nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a><span>/</span><a href="/industries">Industries</a><span>/</span><span aria-current="page">${esc(d.name)}</span></nav>
      <span class="kicker"><b>Industry</b> ${esc(d.name)}</span>
      <h1 class="h2" id="id-h">${esc(d.h1)}</h1>
      <p class="lead">${esc(d.p1)}</p>
      <div class="hero-ctas left"><a href="/contact" class="btn btn-dark">Get Started {{arrow}}</a><a href="/industries" class="btn btn-line">All Industries</a></div>
    </div>
    <div class="inc rv d1">
      <h2>Tasks we can take on</h2>
      <ul>${d.tasks.map(t => `<li><span class="c">{{check}}</span>${esc(t)}</li>`).join('')}</ul>
    </div>
  </div>
</section>

<section class="sv-about" aria-labelledby="ia-h">
  <div class="wrap">
    <div class="sv-about-in rv">
      <h2 class="h2" id="ia-h">How JurisAssistMe supports ${esc(d.name.toLowerCase())}</h2>
      <p>${esc(d.p2)}</p>
      <p>Because JurisAssistMe is a managed service, you are introduced to your professional and approve them before they start, and coordination continues once they join.</p>
    </div>
  </div>
</section>

<section class="rel" aria-labelledby="rl-h">
  <div class="wrap">
    <h2 class="h2" id="rl-h">Recommended <span class="gg-d">services</span></h2>
    <div class="rel-grid">${serviceCards(svcs)}</div>
  </div>
</section>

${stepsBlock('How to get started <span class="gg-d">with JurisAssistMe.</span>', '3 simple steps')}

${ctaBlock}`;
  return {
    slug: 'industries/' + d.slug, nav: 'industries', url: '/industries/' + d.slug,
    title: d.title, desc: d.meta, faqs: d.faqs, body,
    crumbs: [['Industries', '/industries'], [d.name, '/industries/' + d.slug]]
  };
}

// ---- Our Team (about page): cards open a popup with the person's details ----
function teamSection() {
  const photo = m => '/images/team/' + m.photo;
  const alt = m => `Sample photo of ${m.name}, ${m.role}`;
  const data = TEAM.map(m => ({ name: m.name, role: m.role, photo: photo(m), alt: alt(m), bio: m.bio, focus: m.focus }));
  return `<section class="team-sec" id="our-team" aria-labelledby="tm-h">
  <div class="wrap">
    <div class="sec-head rv"><span class="kicker"><b>Our Team</b> The people behind your team</span><h2 class="h2" id="tm-h">Meet Our <span class="gg-d">Team.</span></h2><p class="lead">Click a card to learn more about each person.</p></div>
    <ul class="tm-grid">${TEAM.map((m, i) => `
      <li class="rv${i % 3 ? ' d' + (i % 3) : ''}"><button type="button" class="tm-card" data-team="${i}" aria-haspopup="dialog" aria-label="View profile: ${esc(m.name)}, ${esc(m.role)}">
        <span class="tm-ph"><img src="${photo(m)}" alt="${esc(alt(m))}" width="600" height="750" loading="lazy" decoding="async"></span>
        <span class="tm-info"><span class="tm-n">${esc(m.name)}</span><span class="tm-r">${esc(m.role)}</span><span class="tm-v">View profile {{arrow}}</span></span>
      </button></li>`).join('')}
    </ul>
  </div>
  <dialog class="tm-dlg" id="tmDlg" aria-labelledby="tmName">
    <button type="button" class="tm-x" aria-label="Close profile"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
    <div class="tm-dc">
      <div class="tm-dph"><img id="tmImg" src="" alt="" width="600" height="750"></div>
      <div class="tm-dtx">
        <span class="tagc" id="tmRole"></span>
        <h3 id="tmName"></h3>
        <p id="tmBio"></p>
        <h4>Focus areas</h4>
        <div class="tags-l" id="tmFocus"></div>
        <a href="/contact" class="btn btn-dark">Work with our team {{arrow}}</a>
      </div>
    </div>
  </dialog>
  <script type="application/json" id="team-data">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>
</section>
`;
}

// ---- Blog ----
const fmtDate = d => new Date(d + 'T00:00:00Z').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
const fmtMonth = d => new Date(d + 'T00:00:00Z').toLocaleDateString('en-US', { year: 'numeric', month: 'short', timeZone: 'UTC' });
const strip = h => h.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
const words = b => strip(b.html).split(' ').length + b.faqs.reduce((n, [q, a]) => n + strip(q + ' ' + a).split(' ').length, 0);
const readTime = b => Math.max(1, Math.ceil(words(b) / 200)) + ' min read';
const slugify = t => t.toLowerCase().replace(/&/g, ' ').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const imgUrl = b => '/images/blog/' + b.image.file;

const shIcon = p => `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="${p}"/></svg>`;
function shareBar(url, title, image, cls) {
  const u = encodeURIComponent(absolute(url)), t = encodeURIComponent(title);
  const nets = [
    ['Facebook', `https://www.facebook.com/sharer/sharer.php?u=${u}`, 'M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.69.24 2.69.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.88v2.26h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07z'],
    ['X', `https://twitter.com/intent/tweet?url=${u}&text=${t}`, 'M18.9 1.15h3.68l-8.04 9.19L24 22.85h-7.4l-5.8-7.58-6.63 7.58H.49l8.6-9.83L0 1.15h7.59l5.24 6.93 6.07-6.93zm-1.29 19.5h2.04L6.48 3.24H4.3l13.31 17.41z'],
    ['Pinterest', `https://www.pinterest.com/pin/create/button/?url=${u}&description=${t}&media=${encodeURIComponent(absolute(image))}`, 'M12.02 0C5.4 0 .04 5.37.04 11.98c0 5.08 3.16 9.42 7.63 11.17-.1-.95-.2-2.4.04-3.44.22-.94 1.4-5.97 1.4-5.97s-.36-.72-.36-1.78c0-1.67.97-2.92 2.17-2.92 1.02 0 1.52.77 1.52 1.7 0 1.03-.66 2.58-1 4.01-.28 1.2.6 2.18 1.78 2.18 2.13 0 3.77-2.25 3.77-5.5 0-2.87-2.06-4.88-5.01-4.88-3.41 0-5.42 2.56-5.42 5.2 0 1.03.4 2.13.89 2.73.1.12.11.22.08.34-.09.37-.29 1.2-.33 1.36-.05.22-.17.26-.4.16-1.5-.7-2.43-2.89-2.43-4.65 0-3.78 2.75-7.26 7.92-7.26 4.16 0 7.4 2.97 7.4 6.93 0 4.14-2.6 7.47-6.23 7.47-1.22 0-2.36-.63-2.75-1.38l-.75 2.85c-.27 1.04-1 2.35-1.49 3.15 1.12.35 2.31.53 3.55.53 6.62 0 11.98-5.37 11.98-11.98C24 5.37 18.64 0 12.02 0z'],
    ['LinkedIn', `https://www.linkedin.com/sharing/share-offsite/?url=${u}`, 'M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z']
  ];
  const wa = `https://wa.me/?text=${t}%20${u}`;
  const mail = `mailto:?subject=${t}&body=${u}`;
  const items = nets.map(([n, h, p]) => `<li><a href="${h}" target="_blank" rel="noopener noreferrer" aria-label="Share on ${n}" title="Share on ${n}">${shIcon(p)}</a></li>`).join('')
    + `<li><a href="${wa}" target="_blank" rel="noopener noreferrer" aria-label="Share on WhatsApp" title="Share on WhatsApp">${shIcon('M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.14-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.08 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.07-.12-.27-.2-.57-.35zM12.05 21.8h-.01a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 0 1-1.51-5.26c0-5.45 4.44-9.88 9.89-9.88 2.64 0 5.12 1.03 6.99 2.9a9.82 9.82 0 0 1 2.89 6.99c0 5.45-4.44 9.88-9.88 9.88zM20.5 3.49A11.8 11.8 0 0 0 12.05 0C5.5 0 .16 5.34.16 11.89c0 2.1.55 4.14 1.59 5.95L.06 24l6.3-1.65a11.88 11.88 0 0 0 5.68 1.45h.01c6.55 0 11.89-5.34 11.89-11.89 0-3.18-1.24-6.16-3.44-8.42z')}</a></li>`
    + `<li><a href="${mail}" aria-label="Share by email" title="Share by email">${shIcon('M2 5.5A2.5 2.5 0 0 1 4.5 3h15A2.5 2.5 0 0 1 22 5.5v13a2.5 2.5 0 0 1-2.5 2.5h-15A2.5 2.5 0 0 1 2 18.5v-13zm2.2.3 7.8 6.1 7.8-6.1a.5.5 0 0 0-.3-.1h-15a.5.5 0 0 0-.3.1zM20.5 8l-7.9 6.2a1 1 0 0 1-1.2 0L3.5 8v10.5c0 .55.45 1 1 1h15c.55 0 1-.45 1-1V8z')}</a></li>`;
  return `<div class="share ${cls || ''}"><span class="share-l">Share this article</span><ul>${items}</ul></div>`;
}

function blogIndex() {
  const body = `<section class="res first" aria-labelledby="bl-h">
  <div class="wrap">
    <div class="sec-head rv">
      <span class="kicker"><b>Blog</b> Guides &amp; insights</span>
      <h1 class="h2" id="bl-h">The JurisAssistMe <span class="gg-d">Blog.</span></h1>
      <p class="lead">Practical guidance on delegating, hiring and running a lean remote team.</p>
    </div>
    <div class="post-grid">${BLOGS.map((b, i) => `
      <a href="/blog/${b.slug}" class="post-card rv${i ? ' d' + Math.min(i, 2) : ''}">
        <span class="pc-img"><img src="${imgUrl(b)}" alt="${esc(b.image.alt)}" width="${b.image.width}" height="${b.image.height}" loading="${i < 3 ? 'eager' : 'lazy'}" decoding="async"></span>
        <span class="pc-body">
          <span class="tagc">${esc(b.tag)}</span>
          <h2>${esc(b.h1)}</h2>
          <p>${esc(b.excerpt)}</p>
          <small>${fmtMonth(b.date)} · ${readTime(b)}</small>
          <span class="more">Read article {{arrow}}</span>
        </span>
      </a>`).join('')}
    </div>
  </div>
</section>

${ctaBlock}`;
  return { slug: 'blog', nav: 'blog', url: '/blog', crumbs: [['Blog', '/blog']], title: 'Blog: Virtual Assistant Hiring & Remote Team Guides | JurisAssistMe', desc: 'Guides from JurisAssistMe on hiring a virtual assistant, delegating work and running a lean remote team for U.S. businesses.', body };
}

function blogPost(b) {
  // Table of contents is built from the article's <h2>s; each gets an id.
  const toc = [];
  const used = {};
  const html = b.html.replace(/<h2>(.*?)<\/h2>/g, (_, t) => {
    let id = slugify(strip(t));
    used[id] = (used[id] || 0) + 1;
    if (used[id] > 1) id += '-' + used[id];
    toc.push([id, strip(t)]);
    return `<h2 id="${id}">${t}</h2>`;
  });
  const url = '/blog/' + b.slug;
  const body = `<section class="bp-hero first" aria-labelledby="bp-h">
  <div class="wrap">
    <a href="/blog" class="back">{{back}}<span>Back to Blog</span></a>
    <nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a><span>/</span><a href="/blog">Blog</a><span>/</span><span aria-current="page">${esc(b.tag)}</span></nav>
    <span class="kicker"><b>${esc(b.tag)}</b> ${fmtMonth(b.date)}</span>
    <h1 class="h2" id="bp-h">${esc(b.h1)}</h1>
    <p class="lead">${esc(b.excerpt)}</p>
    <div class="bp-meta"><p class="meta">By the JurisAssistMe team · <time datetime="${b.date}">${fmtDate(b.date)}</time> · ${readTime(b)}</p>${shareBar(url, b.h1, imgUrl(b), 'sm')}</div>
  </div>
</section>

<figure class="bp-fig">
  <div class="wrap"><img src="${imgUrl(b)}" alt="${esc(b.image.alt)}" width="${b.image.width}" height="${b.image.height}" fetchpriority="high" decoding="async"></div>
</figure>

<section class="bp-body">
  <div class="wrap bp-layout">
    <aside class="toc" aria-label="Table of contents">
      <div class="toc-in">
        <h2 class="toc-h">Table of contents</h2>
        <ol>${toc.map(([id, t]) => `<li><a href="#${id}">${esc(t)}</a></li>`).join('')}</ol>
      </div>
    </aside>
    <article class="prose bp-art">
${html}
    </article>
  </div>
</section>`;
  const org = { '@type': 'Organization', name: 'JurisAssistMe', url: SITE_URL };
  return {
    slug: 'blog/' + b.slug, nav: 'blog', url, faqs: b.faqs, body, ogType: 'article', image: imgUrl(b), published: b.date,
    crumbs: [['Blog', '/blog'], [b.h1, url]], title: b.metaTitle, desc: b.metaDesc, keywords: b.keywords,
    ld: `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@type': 'Article', headline: b.h1, description: b.metaDesc, image: absolute(imgUrl(b)), datePublished: b.date, dateModified: b.date, wordCount: words(b), keywords: b.keywords.join(', '), articleSection: b.tag, inLanguage: 'en-US', mainEntityOfPage: { '@type': 'WebPage', '@id': absolute(url) }, author: org, publisher: { ...org, logo: { '@type': 'ImageObject', url: absolute('/logo.svg') } } })}</script>`
  };
}

// ---- Assemble ----
const pages = STATIC.map(p => ({ ...p, crumbs: p.slug === 'index' ? null : [[CRUMB[p.slug] || p.slug, p.url]], faqs: PAGE_FAQS[p.slug], body: fs.readFileSync(path.join(SRC, p.slug + '.html'), 'utf8') }));
SERVICES.forEach((s, i) => pages.push(servicePage(s, i)));
INDUSTRY_SEO.forEach((d, i) => pages.push(industryPage(d, i)));
pages.push(blogIndex());
BLOGS.forEach(b => pages.push(blogPost(b)));

fs.mkdirSync(path.join(OUT, 'services'), { recursive: true });
fs.mkdirSync(path.join(OUT, 'blog'), { recursive: true });
fs.mkdirSync(path.join(OUT, 'industries'), { recursive: true });
for (const p of pages) fs.writeFileSync(path.join(OUT, p.slug + '.html'), render(p, fill(p.body)).replace(/\{\{back\}\}/g, back).replace(/\{\{arrow\}\}/g, arrow).replace(/\{\{check\}\}/g, check));

const NL = '\n';
if (SITE_URL) {
  const urls = pages.filter(p => !p.noindex).map(p => `  <url><loc>${SITE_URL}${p.url}</loc></url>`).join(NL);
  fs.writeFileSync(path.join(OUT, 'sitemap.xml'), ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">', urls, '</urlset>', ''].join(NL));
}
fs.writeFileSync(path.join(OUT, 'robots.txt'), ['User-agent: *', 'Allow: /', ...(SITE_URL ? [`Sitemap: ${SITE_URL}/sitemap.xml`] : []), ''].join(NL));
console.log(`Built ${pages.length} pages`);
