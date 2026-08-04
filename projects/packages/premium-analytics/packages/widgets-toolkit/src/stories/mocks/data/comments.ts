/**
 * Mock response for the Stats `comments` endpoint (`/proxy/v1.1/stats/comments`).
 *
 * The endpoint is all-time and returns two parallel lists — comment authors and
 * commented posts — surfaced by the Top commented authors and Top commented
 * posts widgets. This fixture populates both so either widget is reviewable.
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
			link: '?s=alex.rivera@example.com',
			gravatar: 'https://www.gravatar.com/avatar/00000000000000000000000000000a01?s=96',
		},
		{
			name: 'Priya Nair',
			comments: 97,
			link: '?s=priya.nair@example.com',
			gravatar: 'https://www.gravatar.com/avatar/00000000000000000000000000000a02?s=96',
		},
		{
			name: 'Marcus Chen',
			comments: 74,
			link: '?s=marcus.chen@example.com',
			gravatar: 'https://www.gravatar.com/avatar/00000000000000000000000000000a03?s=96',
		},
		{
			name: 'Sofia Almeida',
			comments: 61,
			link: '?s=sofia.almeida@example.com',
			gravatar: 'https://www.gravatar.com/avatar/00000000000000000000000000000a04?s=96',
		},
		{
			name: 'Daniel Okoro',
			comments: 45,
			link: '?s=daniel.okoro@example.com',
			gravatar: 'https://www.gravatar.com/avatar/00000000000000000000000000000a05?s=96',
		},
		{
			name: 'Hannah Weber',
			comments: 33,
			link: '?s=hannah.weber@example.com',
			gravatar: 'https://www.gravatar.com/avatar/00000000000000000000000000000a06?s=96',
		},
		{
			name: 'Leah Kim',
			comments: 22,
			// WordPress.com-user rows use `?user_id=` and intentionally remain
			// unlinked because wp-admin has no equivalent author search URL.
			link: '?user_id=1662656',
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
