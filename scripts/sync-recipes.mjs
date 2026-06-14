import fs from 'fs';
import path from 'path';

const API_URL = 'https://script.google.com/macros/s/AKfycbzVMvql-id13ejhEw1Z35xs9JuNIDXIMAgLsNHvMpmyQHy86Ebsc6VCXMmJS_b7XlmO/exec';
const OUTPUT_DIR = './src/content/recipes';

function parseList(val) {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        // Fallback to split
      }
    }
    return trimmed.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
  }
  return [];
}

function normalizeRecipe(raw) {
  if (!raw.slug || !raw.title) {
    throw new Error(`Missing required fields: slug='${raw.slug}', title='${raw.title}'`);
  }

  const ingredients = parseList(raw.ingredients);
  const steps = parseList(raw.instructions || raw.steps);
  const tags = parseList(raw.tags);
  
  const faq = parseList(raw.faq).map(item => {
    if (typeof item === 'object' && item !== null) {
      return {
        question: String(item.question || item.q || '').trim(),
        answer: String(item.answer || item.a || item.value || '').trim()
      };
    }
    return null;
  }).filter(Boolean);

  const parseNum = (val) => {
    if (val === undefined || val === null) return 0;
    const num = Number(val);
    return isNaN(num) ? 0 : num;
  };

  let date = new Date().toISOString();
  if (raw.date) {
    const parsedDate = new Date(raw.date);
    if (!isNaN(parsedDate.getTime())) {
      date = parsedDate.toISOString();
    }
  }

  let image = raw.image || '../../assets/images/cookies.webp';
  if (typeof image === 'string') {
    if (image.startsWith('/images/')) {
      const filename = path.basename(image, path.extname(image));
      image = `../../assets/images/${filename}.webp`;
    } else if (!image.startsWith('.') && !image.startsWith('http')) {
      const filename = path.basename(image, path.extname(image));
      image = `../../assets/images/${filename}.webp`;
    }
  }

  let jumpToRecipeUrl = '';
  const rawUrl = raw['Jump to Recipe'] || raw.jump_to_recipe_url || raw.jumpToRecipe || raw.jump_to_recipe || raw.jumpToRecipeUrl;
  if (rawUrl) {
    const trimmed = String(rawUrl).trim();
    if (trimmed) {
      try {
        let urlToCheck = trimmed;
        if (!/^https?:\/\//i.test(urlToCheck)) {
          urlToCheck = 'https://' + urlToCheck;
        }
        new URL(urlToCheck);
        jumpToRecipeUrl = urlToCheck;
      } catch (e) {
        console.warn(`[CMS Sync] Invalid URL for recipe '${raw.title || 'untitled'}': ${trimmed}`);
      }
    }
  }

  return {
    title: String(raw.title).trim(),
    date,
    description: String(raw.description || '').trim(),
    image,
    prepTime: parseNum(raw.prepTime),
    cookTime: parseNum(raw.cookTime),
    servings: parseNum(raw.servings),
    calories: parseNum(raw.calories),
    category: String(raw.category || 'General').trim(),
    tags,
    ingredients,
    steps,
    faq,
    body: String(raw.body || raw.content || '').trim(),
    jump_to_recipe_url: jumpToRecipeUrl || undefined
  };
}

async function sync() {
  console.log(`[CMS Sync] Fetching recipes from CMS...`);
  try {
    const response = await fetch(API_URL);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    if (!data || !Array.isArray(data.recipes)) {
      console.log(`[CMS Sync] No valid recipes array returned from API. Received:`, data);
      return;
    }

    console.log(`[CMS Sync] Found ${data.recipes.length} raw recipes. Normalizing...`);
    
    // Ensure output directory exists
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    let successCount = 0;
    for (const raw of data.recipes) {
      const slug = String(raw.slug || '').trim();
      if (!slug) {
        console.warn(`[CMS Sync] Skipped entry: Missing slug`);
        continue;
      }

      const status = String(raw.status || '').trim().toLowerCase();
      const filename = `${slug}.json`;
      const filePath = path.join(OUTPUT_DIR, filename);
      const fileExists = fs.existsSync(filePath);

      if (status === 'deleted') {
        if (fileExists) {
          fs.unlinkSync(filePath);
          console.log(`[CMS Sync] Deleted: ${filename} (Status: deleted)`);
        } else {
          console.log(`[CMS Sync] Ignored: ${slug} (Status: deleted)`);
        }
        continue;
      }

      if (status === 'archived') {
        if (fileExists) {
          fs.unlinkSync(filePath);
          console.log(`[CMS Sync] Archived: ${filename} removed from public site (Status: archived)`);
        } else {
          console.log(`[CMS Sync] Ignored: ${slug} (Status: archived)`);
        }
        continue;
      }

      if (status === 'draft') {
        if (fileExists) {
          fs.unlinkSync(filePath);
          console.log(`[CMS Sync] Draft: ${filename} removed from public site (Status: draft)`);
        } else {
          console.log(`[CMS Sync] Ignored: ${slug} (Status: draft)`);
        }
        continue;
      }

      if (status !== 'published') {
        console.warn(`[CMS Sync] Skipped entry: ${slug} has unknown status: '${raw.status}'`);
        continue;
      }

      try {
        const normalized = normalizeRecipe(raw);
        fs.writeFileSync(filePath, JSON.stringify(normalized, null, 2), 'utf8');
        if (fileExists) {
          console.log(`[CMS Sync] Updated: ${filename}`);
        } else {
          console.log(`[CMS Sync] Created: ${filename}`);
        }
        successCount++;
      } catch (err) {
        console.warn(`[CMS Sync] Skipped entry: ${err.message}`);
      }
    }
    console.log(`[CMS Sync] Completed. Synchronized ${successCount} recipes.`);
  } catch (err) {
    console.error(`[CMS Sync] Error: Failed to sync from CMS.`, err.message);
  }
}

sync();
