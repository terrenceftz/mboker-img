import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog =  defineCollection({
		loader: glob({ base: "./src/content/blog/", pattern: "**/*.{md,mdx}" }),
		schema: z.object({
			title: z.string(),
			description: z.string().optional(),
			publishDate: z.coerce.date(),
			read: z.number().optional(),
			tags: z.array(z.string()).optional(),
			img: z.string().optional(),
			img_alt: z.string().optional(),
		}),
});

export const collections = {blog};