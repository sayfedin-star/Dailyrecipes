import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const recipes = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/recipes" }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    description: z.string(),
    image: z.string(),
    prepTime: z.number(),
    cookTime: z.number(),
    servings: z.number(),
    calories: z.number(),
    category: z.string(),
    tags: z.array(z.string()),
    ingredients: z.array(z.string()),
    steps: z.array(z.string()),
  }),
});

export const collections = { recipes };
