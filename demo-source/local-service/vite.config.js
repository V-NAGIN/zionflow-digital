import { defineConfig } from 'vite';
import { site } from './src/site.config.js';
import { renderSite, escapeHTML as e } from './src/render.js';
export default defineConfig({
  base:'/local-service-demo/',
  plugins: [{name:'personalized-static-html',transformIndexHtml: {order:'pre',handler(html) {
    const url=site.canonical && /^https:\/\//.test(site.canonical) ? site.canonical : null;
    return html.replace('<!--SITE-->',renderSite()).replace('<!--META-->',`<title>${e(site.title)}</title><meta name="description" content="${e(site.description)}"><meta name="robots" content="${site.demo?'noindex, nofollow':'index, follow'}"><meta property="og:title" content="${e(site.title)}"><meta property="og:description" content="${e(site.description)}"><meta property="og:type" content="website"><meta name="twitter:card" content="summary_large_image">${url?`<link rel="canonical" href="${e(url)}"><meta property="og:url" content="${e(url)}"><meta property="og:image" content="${e(new URL(site.heroImage,url).href)}">`:''}`);
  }}}],
  build: {target:'es2022',sourcemap:false},
});
