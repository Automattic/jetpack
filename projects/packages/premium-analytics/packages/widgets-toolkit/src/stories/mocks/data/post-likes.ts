/**
 * Fixture for the proxied `posts/{id}/likes` endpoint (v1.2): the scoped
 * post's likers, most recent first. Mirrors the deterministic `stats-post`
 * fixture post (`ID: 779`). `found` exceeds the rows so the widget's "N more"
 * footer renders in stories.
 */

import { subMinutes } from 'date-fns';

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

/**
 * Minutes before "now" each like happened — a spread from "just now" to a few
 * days ago so the rows exercise every relative-time bucket.
 */
const LIKED_MINUTES_AGO = [ 1, 12, 65, 190, 320, 1500, 3000, 4600, 7300, 11000 ];

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
			date_liked: subMinutes( new Date(), LIKED_MINUTES_AGO[ index ] ).toISOString(),
		};
	} ),
};
