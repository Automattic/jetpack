/**
 * Fixture for the core `/wp/v2/posts` endpoint, addressed by ID (`include=<id>`).
 *
 * The single-post highlight widgets read a reported post's title, permalink,
 * publish date, and featured image from the local core endpoint, because Stats
 * report rows carry no featured image. Only the `include=` form is served here:
 * the Latest post stories mock the unfiltered "newest post" form themselves.
 *
 * The IDs match the `stats/top-posts` fixture in `register-stats-mocks.ts`, so
 * the Popular post widget resolves the winning row to real content.
 */

// A neutral gradient stands in for a featured image, inline so Storybook needs
// no network request or bundled asset.
const FEATURED_IMAGE_URL =
	"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0' stop-color='%231d4ed8'/%3E%3Cstop offset='1' stop-color='%2393c5fd'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='800' height='600' fill='url(%23g)'/%3E%3C/svg%3E";

type PostContentFixture = {
	title: string;
	link: string;
	date: string;
};

const POST_CONTENT_BY_ID: Record< string, PostContentFixture > = {
	1: {
		title: 'Hello World Post',
		link: 'https://example.com/hello-world/',
		date: '2026-06-01T09:30:00',
	},
	4: {
		title: 'How we cut our build times in half',
		link: 'https://example.com/build-times/',
		date: '2026-06-18T14:05:00',
	},
};

const FALLBACK_POST_CONTENT: PostContentFixture = {
	title: 'A post from the archives',
	link: 'https://example.com/from-the-archives/',
	date: '2026-05-14T11:20:00',
};

/**
 * Builds a core posts response for a single post ID, in the shape
 * `sanitizeLatestPostResponse()` reads (a one-item array with embedded featured
 * media).
 *
 * @param postId - The requested post ID, from the request's `include` param.
 * @return The raw core posts response.
 */
export function buildPostContentResponse( postId: string ) {
	const fixture = POST_CONTENT_BY_ID[ postId ] ?? FALLBACK_POST_CONTENT;

	return [
		{
			id: Number( postId ),
			title: { rendered: fixture.title },
			link: fixture.link,
			date: fixture.date,
			featured_media: 42,
			_embedded: {
				'wp:featuredmedia': [
					{
						source_url: FEATURED_IMAGE_URL,
						alt_text: 'Featured image',
					},
				],
			},
		},
	];
}
