/**
 * Mock response for the Stats `comments` endpoint (`/proxy/v1.1/stats/comments`).
 *
 * The endpoint is all-time and returns two parallel lists — comment authors and
 * commented posts — which the widget shows through its "By authors" / "By posts
 * & pages" selector. This fixture populates both so the toggle is reviewable.
 *
 * Gravatar URLs are used for author avatars: the comments processor strips each
 * URL's query string and re-appends `?d=mm`, so Storybook renders Gravatar's
 * default avatar for these placeholder hashes.
 */
export const mockCommentsData = {
	date: '2026-06-22',
	authors: [
		{
			name: 'Alex Rivera',
			comments: 128,
			link: 'https://example.com/author/alex-rivera',
			gravatar: 'https://www.gravatar.com/avatar/00000000000000000000000000000a01?s=96',
		},
		{
			name: 'Priya Nair',
			comments: 97,
			link: 'https://example.com/author/priya-nair',
			gravatar: 'https://www.gravatar.com/avatar/00000000000000000000000000000a02?s=96',
		},
		{
			name: 'Marcus Chen',
			comments: 74,
			link: 'https://example.com/author/marcus-chen',
			gravatar: 'https://www.gravatar.com/avatar/00000000000000000000000000000a03?s=96',
		},
		{
			name: 'Sofia Almeida',
			comments: 61,
			link: 'https://example.com/author/sofia-almeida',
			gravatar: 'https://www.gravatar.com/avatar/00000000000000000000000000000a04?s=96',
		},
		{
			name: 'Daniel Okoro',
			comments: 45,
			link: 'https://example.com/author/daniel-okoro',
			gravatar: 'https://www.gravatar.com/avatar/00000000000000000000000000000a05?s=96',
		},
		{
			name: 'Hannah Weber',
			comments: 33,
			link: 'https://example.com/author/hannah-weber',
			gravatar: 'https://www.gravatar.com/avatar/00000000000000000000000000000a06?s=96',
		},
		{
			name: 'Leah Kim',
			comments: 22,
			link: 'https://example.com/author/leah-kim',
			gravatar: 'https://www.gravatar.com/avatar/00000000000000000000000000000a07?s=96',
		},
	],
	posts: [
		{
			id: 3201,
			title: 'Launching our summer collection',
			comments: 84,
			link: 'https://example.com/summer-collection',
		},
		{
			id: 3188,
			title: 'A guide to sustainable packaging',
			comments: 63,
			link: 'https://example.com/sustainable-packaging',
		},
		{
			id: 3150,
			title: 'Behind the scenes at our studio',
			comments: 51,
			link: 'https://example.com/behind-the-scenes',
		},
		{
			id: 3099,
			title: 'How we source our materials',
			comments: 38,
			link: 'https://example.com/material-sourcing',
		},
		{
			id: 3042,
			title: 'Customer stories: made to last',
			comments: 27,
			link: 'https://example.com/customer-stories',
		},
		{
			id: 2988,
			title: 'Care tips for your new pieces',
			comments: 19,
			link: 'https://example.com/care-tips',
		},
		{
			id: 2900,
			title: 'Our roadmap for next year',
			comments: 12,
			link: 'https://example.com/roadmap',
		},
	],
	monthly_comments: 260,
	total_comments: 5810,
};
