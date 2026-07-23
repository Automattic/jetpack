/**
 * Mock data for the Stats `tags` endpoint (drives the "Tags & categories" widget).
 *
 * Mirrors the WPCOM `stats/tags` response: a top-level `tags` list where each item
 * groups one or more tags/categories that share posts, with the group's combined
 * `views`. Single-member items link straight to their archive; multi-member items
 * have no combined archive URL and drill down to their members in the widget.
 *
 * The fixture intentionally exercises every reviewable case: single categories
 * (folder icon) and tags (tag icon) that link out, and grouped rows — one mixing
 * a category with a tag, one combining two categories — that drill down.
 */
export const mockTagsData = {
	date: '2026-06-22',
	period: 'month',
	tags: [
		{
			tags: [
				{ type: 'category', name: 'Recipes', link: 'https://example.com/category/recipes/' },
			],
			views: 1240,
		},
		{
			tags: [ { type: 'tag', name: 'vegan', link: 'https://example.com/tag/vegan/' } ],
			views: 980,
		},
		{
			tags: [
				{ type: 'category', name: 'Desserts', link: 'https://example.com/category/desserts/' },
				{ type: 'tag', name: 'chocolate', link: 'https://example.com/tag/chocolate/' },
			],
			views: 760,
		},
		{
			tags: [ { type: 'tag', name: 'gluten-free', link: 'https://example.com/tag/gluten-free/' } ],
			views: 645,
		},
		{
			tags: [
				{ type: 'category', name: 'Breakfast', link: 'https://example.com/category/breakfast/' },
			],
			views: 512,
		},
		{
			tags: [
				{ type: 'category', name: 'Dinner', link: 'https://example.com/category/dinner/' },
				{
					type: 'category',
					name: 'Quick Meals',
					link: 'https://example.com/category/quick-meals/',
				},
			],
			views: 430,
		},
		{
			tags: [
				{ type: 'tag', name: 'high-protein', link: 'https://example.com/tag/high-protein/' },
			],
			views: 318,
		},
		{
			tags: [ { type: 'tag', name: 'budget', link: 'https://example.com/tag/budget/' } ],
			views: 254,
		},
		{
			tags: [ { type: 'category', name: 'Snacks', link: 'https://example.com/category/snacks/' } ],
			views: 187,
		},
		{
			tags: [ { type: 'tag', name: 'meal-prep', link: 'https://example.com/tag/meal-prep/' } ],
			views: 143,
		},
	],
};
