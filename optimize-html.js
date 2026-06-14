import fs from 'fs';
import path from 'path';

const distDir = './dist';

// Find the main CSS file in dist/_astro/
function findCSSFile(dir) {
  const astroDir = path.join(dir, '_astro');
  if (!fs.existsSync(astroDir)) return null;
  const files = fs.readdirSync(astroDir);
  const cssFile = files.find(f => f.startsWith('_astro_content') && f.endsWith('.css'));
  return cssFile ? path.join(astroDir, cssFile) : null;
}

const cssFilePath = findCSSFile(distDir);
if (!cssFilePath) {
  console.log('No main CSS file found. Skipping critical CSS inlining.');
  process.exit(0);
}

const cssUrl = '/' + path.relative(distDir, cssFilePath).replace(/\\/g, '/');
console.log(`Found CSS file: ${cssFilePath} (URL: ${cssUrl})`);

const cssContent = fs.readFileSync(cssFilePath, 'utf8');

// Extract critical CSS blocks (properties, theme, base layers)
let criticalCss = '';

const propertiesMatch = cssContent.match(/@layer properties\{[\s\S]*?\}/);
if (propertiesMatch) criticalCss += propertiesMatch[0] + '\n';

const themeMatch = cssContent.match(/@layer theme\{[\s\S]*?\}/);
if (themeMatch) criticalCss += themeMatch[0] + '\n';

const baseMatch = cssContent.match(/@layer base\{[\s\S]*?\}/);
if (baseMatch) criticalCss += baseMatch[0] + '\n';

// Core layout/above-the-fold utility classes used on recipe, category, and home pages
const criticalClasses = [
  'absolute', 'relative', 'static', 'sticky', 'inset-0', 'top-0', 'z-10', 'z-50',
  'mx-auto', 'px-4', 'sm:px-6', 'lg:px-8', 'h-16', 'h-9', 'h-full', 'w-9', 'w-full',
  'max-w-7xl', 'max-w-4xl', 'max-w-none', 'max-w-xl', 'flex', 'flex-col', 'flex-grow',
  'items-center', 'justify-between', 'justify-center', 'gap-2', 'gap-3', 'gap-4', 'gap-6',
  'overflow-hidden', 'rounded-xl', 'rounded-3xl', 'border-b', 'border-slate-200/50', 'dark:border-slate-800/50',
  'bg-slate-50', 'dark:bg-slate-950', 'bg-white/70', 'dark:bg-slate-900/70', 'backdrop-blur-md',
  'bg-gradient-to-tr', 'from-amber-500', 'to-rose-500', 'text-white', 'font-bold', 'text-lg', 'shadow-lg',
  'shadow-amber-500/20', 'scale-105', 'transition-transform', 'duration-200', 'text-xl', 'bg-gradient-to-r',
  'from-amber-600', 'to-rose-600', 'dark:from-amber-400', 'dark:to-rose-400', 'bg-clip-text', 'text-transparent',
  'gap-6', 'text-sm', 'font-medium', 'text-slate-600', 'hover:text-amber-600', 'dark:text-slate-300',
  'dark:hover:text-amber-400', 'transition-colors', 'flex-grow', 'py-8',
  'mb-4', 'px-3', 'py-1', 'rounded-lg', 'bg-amber-100', 'dark:bg-amber-950/40',
  'text-amber-800', 'dark:text-amber-300', 'uppercase', 'tracking-wider', 'text-xs', 'font-semibold',
  'text-slate-400', 'sm:text-4xl', 'md:text-5xl', 'text-slate-900', 'dark:text-white', 'leading-tight', 'text-lg',
  'text-slate-600', 'dark:text-slate-300', 'leading-relaxed', 'mb-6', 'sm:flex-row', 'sm:items-center',
  'border-y', 'border-slate-200/60', 'dark:border-slate-800/60', 'py-3', 'mb-8', 'inline-flex',
  'px-5', 'py-2.5', 'bg-amber-500', 'hover:bg-amber-600', 'active:scale-98', 'shadow-md', 'shadow-amber-500/15',
  'aspect-[16/9]', 'bg-slate-100', 'dark:bg-slate-850', 'border-slate-200/30', 'dark:border-slate-800/35', 'mb-10',
  'object-cover', 'duration-300', 'text-slate-800', 'dark:text-slate-100'
];

function escapeClassName(className) {
  return className
    .replace(/:/g, '\\:')
    .replace(/\//g, '\\/')
    .replace(/\[/g, '\\[')
    .replace(/\]/g, '\\]')
    .replace(/\./g, '\\.')
    .replace(/%/g, '\\%')
    .replace(/#/g, '\\#');
}

// Match utility rules
criticalClasses.forEach(cls => {
  const esc = escapeClassName(cls);
  const regex = new RegExp(`\\.${esc}(?::[\\w-]+)?\\{[^}]*?\\}`, 'g');
  const matches = cssContent.match(regex);
  if (matches) {
    criticalCss += matches.join('\n') + '\n';
  }
});

// Match dark mode queries nested styles
const darkMediaMatch = cssContent.match(/@media\(prefers-color-scheme:dark\)\{[\s\S]*?\}/);
if (darkMediaMatch) {
  const darkContent = darkMediaMatch[0];
  let darkCritical = '';
  criticalClasses.forEach(cls => {
    const esc = escapeClassName(cls);
    const regex = new RegExp(`\\.${esc}(?::[\\w-]+)?\\{[^}]*?\\}`, 'g');
    const matches = darkContent.match(regex);
    if (matches) {
      darkCritical += matches.join('\n') + '\n';
    }
  });
  if (darkCritical) {
    criticalCss += `@media(prefers-color-scheme:dark){\n${darkCritical}}\n`;
  }
}

// Add body and heading font declarations
const fontFaceRegex = /body\{font-family:var\(--font-inter\)[^}]*?\}/g;
const bodyFontMatch = cssContent.match(fontFaceRegex);
if (bodyFontMatch) criticalCss += bodyFontMatch.join('\n') + '\n';

const hFontRegex = /h1,h2,h3,h4,h5,h6\{font-family:var\(--font-outfit\)[^}]*?\}/g;
const hFontMatch = cssContent.match(hFontRegex);
if (hFontMatch) criticalCss += hFontMatch.join('\n') + '\n';

// Walk and optimize HTML files
function optimizeHtmlFiles(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      optimizeHtmlFiles(fullPath);
    } else if (file.endsWith('.html')) {
      let html = fs.readFileSync(fullPath, 'utf8');
      
      // Target the stylesheet link tag
      const linkRegex = new RegExp(`<link\\s+rel="stylesheet"\\s+href="${cssUrl}"\\s*\\/?>`, 'i');
      if (linkRegex.test(html)) {
        console.log(`Optimizing CSS loading for: ${fullPath}`);
        
        const optimizedReplacement = `
<style id="critical-css">${criticalCss.trim()}</style>
<link rel="preload" href="${cssUrl}" as="style" onload="this.onload=null;this.rel='stylesheet'">
<noscript><link rel="stylesheet" href="${cssUrl}"></noscript>
`.trim();
        
        html = html.replace(linkRegex, optimizedReplacement);
        fs.writeFileSync(fullPath, html, 'utf8');
      }
    }
  }
}

optimizeHtmlFiles(distDir);
console.log('HTML optimization complete.');
