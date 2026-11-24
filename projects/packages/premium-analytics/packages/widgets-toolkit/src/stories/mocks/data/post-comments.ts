/**
 * Fixture for the proxied `posts/{id}/replies` endpoint (v1.1): the scoped
 * post's approved comments, most recent first. `found` exceeds the rows so the
 * widget's "N more" footer renders in stories.
 */

import { subMinutes } from 'date-fns';

const COMMENTERS = [
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

const COMMENTED_MINUTES_AGO = [ 1, 12, 65, 190, 320, 1500, 3000, 4600, 7300, 11000 ];

export const mockPostCommentsData = {
	found: 33,
	site_ID: 82974409,
	comments: COMMENTERS.map( ( name, index ) => ( {
		ID: 2000 + index,
		author: {
			ID: 3000 + index,
			login: name.toLowerCase().replace( /\s+/g, '' ),
			name,
			avatar_URL: `https://gravatar.com/avatar/mock-commenter-${ index }?d=identicon&s=96`,
		},
		date: subMinutes( new Date(), COMMENTED_MINUTES_AGO[ index ] ).toISOString(),
		URL: `https://example.com/post/#comment-${ 2000 + index }`,
		status: 'approved',
		type: 'comment',
	} ) ),
};
