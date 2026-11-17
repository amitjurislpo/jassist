// Static page generator: wraps page fragments (src/page-html/*.html plus generated service/industry pages) with the
// shared header/footer (site/render.js) and writes them to public/. Run with `npm run build`.
// The blog list, blog posts and sitemap.xml are NOT written here: they change when a checker approves a post, so the
// Next.js server renders them on request with the same templates (app/blog, app/sitemap.xml).
const fs = require('fs');
const path = require('path');
const site = require('./site/render');

const OUT = path.join(__dirname, 'public');
const pages = site.staticPages();
fs.mkdirSync(path.join(OUT, 'services'), { recursive: true });
fs.mkdirSync(path.join(OUT, 'industries'), { recursive: true });
for (const p of pages) fs.writeFileSync(path.join(OUT, p.slug + '.html'), site.renderHtml(p));

// Files an older build wrote that the server now renders. A public file would win over the server route.
for (const stale of ['blog.html', 'sitemap.xml']) fs.rmSync(path.join(OUT, stale), { force: true });
const blogDir = path.join(OUT, 'blog');
if (fs.existsSync(blogDir)) for (const f of fs.readdirSync(blogDir)) if (f.endsWith('.html')) fs.rmSync(path.join(blogDir, f));
if (fs.existsSync(blogDir) && !fs.readdirSync(blogDir).length) fs.rmdirSync(blogDir);

fs.writeFileSync(path.join(OUT, 'robots.txt'), site.robotsTxt());
// The 404 fragment for the server (site/render.js notFoundPage).
fs.writeFileSync(path.join(__dirname, 'site', 'not-found.generated.js'), '// Written by build.js from src/page-html/404.html. Do not edit.\nmodule.exports = { body: ' + JSON.stringify(site.notFoundFragment()) + ' };\n');
console.log(`Built ${pages.length} pages`);
