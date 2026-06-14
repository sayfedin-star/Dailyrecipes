import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const recipes = defineCollection({
  loader: glob({ pattern: "**/*.{md,json}", base: "./src/content/recipes" }),
  schema: ({ image }) => z.object({
    title: z.string(),
    date: z.coerce.date(),
    description: z.string(),
    image: image(),
    prepTime: z.number(),
    cookTime: z.number(),
    servings: z.number(),
    calories: z.number(),
    category: z.string(),
    tags: z.array(z.string()),
    ingredients: z.array(z.string()),
    steps: z.array(z.string()),
    faq: z.array(z.object({
      question: z.string(),
      answer: z.string()
    })).optional(),
    body: z.string().optional(),
    jumpToRecipeUrl: z.string().optional()
  }),
});

export const collections = { recipes };
