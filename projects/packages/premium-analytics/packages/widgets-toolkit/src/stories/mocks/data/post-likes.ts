/**
 * Fixture for the proxied `posts/{id}/likes` endpoint (v1.1): the scoped
 * post's likers, most recent first. Mirrors the deterministic `stats-post`
 * fixture post (`ID: 779`). `found` exceeds the rows so the widget's "N more"
 * footer renders in stories.
 */

const LIKERS = [
	'Olivia Park',
	'Hiroshi Tanaka',
	'Emma Rossi',
	'Aarav Patel',
	'Sofia Nguyen',
	'Ethan Walsh',
	'Ava Mitchell',
	'Luca Moreau',
	'Mia Okafor',
	'Noah Lindgren',
];

export const mockPostLikesData = {
	found: 33,
	i_like: false,
	likes: LIKERS.map( ( name, index ) => {
		const login = name.toLowerCase().replace( /\s+/g, '' );

		return {
			ID: 1000 + index,
			login,
			name,
			// Deterministic distinct identicons, so rows are visually distinct
			// without bundling image assets.
			avatar_URL: `https://gravatar.com/avatar/mock-liker-${ index }?d=identicon&s=96`,
			profile_URL: `https://gravatar.com/${ login }`,
		};
	} ),
};
