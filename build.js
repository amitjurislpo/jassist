// Static page generator: wraps page fragments (src/pages/*.html plus generated service/blog pages)
// with the shared header/footer and writes them to public/. Run with `npm run build`.
// Set SITE_URL to also emit canonical tags, sitemap.xml and robots.txt.
const fs = require('fs');
const path = require('path');
const { SERVICES, BLOGS: BLOGS_BASE, PAGE_FAQS } = require('./src/data');
const { SERVICE_SEO, INDUSTRY_SEO, PAGE_COPY, BLOGS_EXTRA } = require('./src/seo');
const BLOGS = [...BLOGS_EXTRA, ...BLOGS_BASE];

const SRC = path.join(__dirname, 'src', 'pages');
const OUT = path.join(__dirname, 'public');
const SITE_URL = (process.env.SITE_URL || '').replace(/\/$/, '');

const EMAIL = 'contact@jurislpo.com';
const PHONE_DISPLAY = '+1 (646) 233-8454';
const PHONE_HREF = 'tel:+16462338454';

const arrow = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
const check = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const esc = t => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

const NAV = [
  ['services', '/services', 'Services'],
  ['solutions', '/solutions', 'Solutions'],
  ['why-j-assist', '/why-j-assist', 'Why J Assist'],
  ['industries', '/industries', 'Industries'],
  ['about', '/about', 'About Us'],
  ['blog', '/blog', 'Blog'],
  ['resources', '/resources', 'Resources']
];

const STATIC = [
  { slug: 'index', nav: null, url: '/', title: 'Virtual Assistant Services & Remote Teams | J Assist', desc: 'J Assist provides dedicated virtual assistants and managed remote teams for U.S. businesses: executive assistants, sales, marketing, bookkeeping and more.' },
  { slug: 'services', nav: 'services', url: '/services', title: 'Virtual Assistant & Remote Support Services | J Assist', desc: 'Nine specialties: virtual executive assistant, social media, website development, real estate support, lead generation, content, SEO, design and bookkeeping.' },
  { slug: 'solutions', nav: 'solutions', url: '/solutions', title: 'How to Hire a Virtual Assistant: Our 4-Step Process | J Assist', desc: 'Tell us what you need, get matched, interview your virtual assistant and start growing. See how J Assist builds your remote team.' },
  { slug: 'why-j-assist', nav: 'why-j-assist', url: '/why-j-assist', title: 'Managed Virtual Assistants vs. Freelancers | J Assist', desc: 'J Assist is not a freelancer marketplace. We match, manage and support dedicated virtual professionals who work as part of your team.' },
  { slug: 'industries', nav: 'industries', url: '/industries', title: 'Virtual Assistants for Law Firms, Real Estate & More', desc: 'Virtual assistant support for law firms, real estate, accounting and CPA firms, e-commerce, professional services, startups and small businesses.' },
  { slug: 'about', nav: 'about', url: '/about', title: 'About J Assist | Virtual Business Support Company', desc: 'J Assist helps U.S. businesses access reliable, skilled virtual professionals without the complexity of traditional hiring.' },
  { slug: 'resources', nav: 'resources', url: '/resources', title: 'Resources: Guides & Case Studies | J Assist', desc: 'Guides on hiring and working with virtual assistants, plus upcoming case studies from J Assist.' },
  { slug: 'contact', nav: null, url: '/contact', title: 'Contact J Assist | Hire a Virtual Assistant Team', desc: `Email ${EMAIL} or call ${PHONE_DISPLAY} to build your virtual assistant team with J Assist.` },
  { slug: 'privacy-policy', nav: null, noindex: true, url: '/privacy-policy', title: 'Privacy Policy | J Assist', desc: 'J Assist privacy policy.' },
  { slug: 'terms-of-service', nav: null, noindex: true, url: '/terms-of-service', title: 'Terms of Service | J Assist', desc: 'J Assist terms of service.' }
];

const logo = '<a href="/" class="logo" aria-label="J Assist home"><span class="mk">J</span><span class="as">ASSIST<i></i></span></a>';

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

const DISCLAIMER = 'J Assist provides virtual business support and is not a law, CPA or financial advisory firm. Website content is general information, not professional advice, and profiles, statistics and logos shown are illustrative.';

const svcLinks = SERVICES.map(s => `<li><a href="/services/${s.slug}">${esc(s.name)}</a></li>`).join('');

function footer() {
  return `<footer class="ftr">
  <div class="wrap">
    <div class="f-top">
      <div class="f-brand">
        ${logo}
        <p><b>Your Team. Beyond Borders.</b><br>Dedicated virtual professionals for U.S. businesses.</p>
      </div>
      <div><h4>Company</h4><ul><li><a href="/about">About</a></li><li><a href="/why-j-assist">Why J Assist</a></li><li><a href="/solutions">How It Works</a></li><li><a href="/contact">Contact</a></li></ul></div>
      <div class="f-svc"><h4>Services</h4><ul>${svcLinks}</ul></div>
      <div><h4>Resources</h4><ul><li><a href="/blog">Blog</a></li><li><a href="/resources#case-studies">Case Studies</a></li></ul></div>
    </div>
    <div class="f-bot">
      <span>© 2026 J Assist. All Rights Reserved.</span>
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
    <div class="faq rv">
${faqs.map(([q, a]) => `      <details><summary>${esc(q)}</summary><p>${a}</p></details>`).join('\n')}
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

const CRUMB = { services: 'Services', solutions: 'Solutions', 'why-j-assist': 'Why J Assist', industries: 'Industries', about: 'About Us', resources: 'Resources', contact: 'Contact', blog: 'Blog' };
const absolute = u => SITE_URL + u;
function breadcrumbLd(page) {
  if (!SITE_URL || !page.crumbs) return '';
  const items = [['Home', '/'], ...page.crumbs].map(([name, url], i) => ({ '@type': 'ListItem', position: i + 1, name, item: absolute(url) }));
  return `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: items })}</script>`;
}
const PHONE_E164 = '+1-646-233-8454';
const orgLd = `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@type': 'Organization', name: 'J Assist', description: 'Virtual business support and dedicated remote teams for U.S. businesses.', email: EMAIL, telephone: PHONE_E164, ...(SITE_URL ? { url: SITE_URL } : {}), contactPoint: { '@type': 'ContactPoint', contactType: 'customer support', email: EMAIL, telephone: PHONE_E164, areaServed: 'US', availableLanguage: 'English' } })}</script>`;

const FAVICON = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="#D8C08A"/><text x="16" y="23" font-family="Georgia,serif" font-size="20" font-weight="700" text-anchor="middle" fill="#111">J</text></svg>');

function render(page, body) {
  const faq = faqSection(page.faqs);
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
<meta property="og:site_name" content="J Assist">
<meta name="twitter:card" content="summary">
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
    .replace(/\{\{arrow\}\}/g, arrow)
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
      <h2 class="h2" id="sa-h">Why choose J Assist for ${esc(seo.kw)}?</h2>
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
    ld: `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@type': 'Service', name: s.name, serviceType: seo.kw, description: seo.meta, provider: { '@type': 'Organization', name: 'J Assist' }, areaServed: { '@type': 'Country', name: 'United States' } })}</script>`
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
      <h2 class="h2" id="ia-h">How J Assist supports ${esc(d.name.toLowerCase())}</h2>
      <p>${esc(d.p2)}</p>
      <p>Because J Assist is a managed service, you are introduced to your professional and approve them before they start, and coordination continues once they join.</p>
    </div>
  </div>
</section>

<section class="rel" aria-labelledby="rl-h">
  <div class="wrap">
    <h2 class="h2" id="rl-h">Recommended <span class="gg-d">services</span></h2>
    <div class="rel-grid">${serviceCards(svcs)}</div>
  </div>
</section>

${stepsBlock('How to get started <span class="gg-d">with J Assist.</span>', '3 simple steps')}

${ctaBlock}`;
  return {
    slug: 'industries/' + d.slug, nav: 'industries', url: '/industries/' + d.slug,
    title: d.title, desc: d.meta, faqs: d.faqs, body,
    crumbs: [['Industries', '/industries'], [d.name, '/industries/' + d.slug]]
  };
}

// ---- Blog ----
const fmtDate = d => new Date(d + 'T00:00:00Z').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });

function blogIndex() {
  const body = `<section class="res first" aria-labelledby="bl-h">
  <div class="wrap">
    <div class="sec-head rv">
      <span class="kicker"><b>Blog</b> Guides &amp; insights</span>
      <h1 class="h2" id="bl-h">The J Assist <span class="gg-d">Blog.</span></h1>
      <p class="lead">Practical guidance on delegating, hiring and running a lean remote team.</p>
    </div>
    <div class="post-grid">${BLOGS.map((b, i) => `
      <a href="/blog/${b.slug}" class="post-card rv${i ? ' d' + Math.min(i, 2) : ''}">
        <span class="tagc">${esc(b.category)}</span>
        <h2>${esc(b.title)}</h2>
        <p>${esc(b.desc)}</p>
        <small>${fmtDate(b.date)} · ${b.read}</small>
        <span class="more">Read article {{arrow}}</span>
      </a>`).join('')}
    </div>
  </div>
</section>

${ctaBlock}`;
  return { slug: 'blog', nav: 'blog', url: '/blog', crumbs: [['Blog', '/blog']], title: 'Blog — Delegation, Hiring & Remote Teams | J Assist', desc: 'Guides from J Assist on delegating work, hiring remote professionals and running a lean team.', body };
}

function blogPost(b) {
  const content = b.body.map(([t, v]) => t === 'p' ? `<p>${v}</p>` : t === 'h2' ? `<h2>${esc(v)}</h2>` : `<ul>${v.map(x => `<li>${esc(x)}</li>`).join('')}</ul>`).join('\n      ');
  const others = BLOGS.filter(x => x !== b);
  const body = `<article class="doc first">
  <div class="wrap">
    <nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a><span>/</span><a href="/blog">Blog</a><span>/</span><span aria-current="page">${esc(b.category)}</span></nav>
    <div class="post-layout">
      <div class="post">
        <span class="tagc">${esc(b.category)}</span>
        <h1 class="h2">${esc(b.title)}</h1>
        <p class="meta"><time datetime="${b.date}">${fmtDate(b.date)}</time> · ${b.read}</p>
        <div class="prose">
          ${content}
        </div>
      </div>
      <aside class="post-side">
        <div class="side-cta"><h3>Need help with this?</h3><p>Tell us what you want to hand off and we'll recommend a team.</p><a href="/contact" class="btn btn-gold">Get Started {{arrow}}</a></div>
        <div class="side-box"><h3>More from the blog</h3>${others.map(o => `<a href="/blog/${o.slug}">${esc(o.title)}</a>`).join('')}</div>
        <div class="side-box"><h3>Our services</h3><a href="/services/virtual-executive-assistant">Virtual Executive Assistant</a><a href="/services/bookkeeping-accounting-support">Bookkeeping &amp; Accounting Support</a><a href="/services">All services</a></div>
      </aside>
    </div>
  </div>
</article>
`;
  return {
    slug: 'blog/' + b.slug, nav: 'blog', url: '/blog/' + b.slug, crumbs: [['Blog', '/blog'], [b.title, '/blog/' + b.slug]], title: b.title.length <= 48 ? `${b.title} | J Assist` : b.title, desc: b.desc, body, ogType: 'article',
    ld: `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@type': 'BlogPosting', headline: b.title, description: b.desc, datePublished: b.date, author: { '@type': 'Organization', name: 'J Assist' }, publisher: { '@type': 'Organization', name: 'J Assist' } })}</script>`
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
for (const p of pages) fs.writeFileSync(path.join(OUT, p.slug + '.html'), render(p, fill(p.body)).replace(/\{\{arrow\}\}/g, arrow).replace(/\{\{check\}\}/g, check));

const NL = '\n';
if (SITE_URL) {
  const urls = pages.filter(p => !p.noindex).map(p => `  <url><loc>${SITE_URL}${p.url}</loc></url>`).join(NL);
  fs.writeFileSync(path.join(OUT, 'sitemap.xml'), ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">', urls, '</urlset>', ''].join(NL));
}
fs.writeFileSync(path.join(OUT, 'robots.txt'), ['User-agent: *', 'Allow: /', ...(SITE_URL ? [`Sitemap: ${SITE_URL}/sitemap.xml`] : []), ''].join(NL));
console.log(`Built ${pages.length} pages`);
