// The gridicon names below are transcribed from a real
// `/sites/{id}/activity/rewindable` response, not invented. That
// distinction matters: the first version of this file hand-wrote
// `gridicon: 'post'` and asserted the mapping against it, so it agreed
// with the code's wrong assumption and stayed green while the live
// dashboard silently dropped 27% of the site's activity (WPCOM sends
// `posts` and `themes`, never `post` or `color`).
//
// If you add a case here, take the gridicon from an actual response.

import { normalizeActivityLog, normalizeEntry } from '../activity-log';
import type { WpcomActivityEntry } from '../../api/activity-log';

/**
 * Gridicon names observed in a 200-entry sample of the live rewindable
 * feed, with the counts they appeared at. Everything outside the mapped
 * five must normalize to `other` rather than disappearing.
 */
const OBSERVED_GRIDICONS = {
	mapped: {
		image: 'upload',
		cloud: 'backup',
		plugins: 'plugin-update',
		posts: 'post',
		themes: 'theme-update',
	} as const,
	// Present in the same sample, no dedicated icon. `notice`, `lock`
	// and `checkmark` show up on the parent activity endpoint too.
	unmapped: [ 'video', 'cog', 'plans', 'notice', 'lock', 'checkmark' ],
};

const backupEntry: WpcomActivityEntry = {
	activity_id: 'a-1',
	name: 'rewind__backup_complete_full',
	gridicon: 'cloud',
	rewind_id: '1777035492',
	published: '2026-05-15T12:26:00.000Z',
	summary: 'Backup and scan complete by Jetpack',
	actor: { type: 'Application', name: 'Jetpack' },
	content: { text: '4 plugins, 1 theme, 20 uploads, 4 posts, 1 page' },
	// In production, `backup_stats` is a JSON-encoded blob — captured
	// here verbatim so the test catches any regression that goes back
	// to rendering this field as a string.
	object: { backup_stats: '{"themes":{"count":1,"list":["twentytwentyfive"]}}' },
};

const postEntry: WpcomActivityEntry = {
	activity_id: 'a-2',
	name: 'post__published',
	gridicon: 'posts',
	published: '2026-05-14T01:23:00.000Z',
	summary: 'Post published by Totoro',
	actor: { type: 'Person', name: 'Totoro' },
	content: { text: 'The Perks of Having a Cat' },
};

const unknownEntry: WpcomActivityEntry = {
	activity_id: 'a-3',
	name: 'mystery__event',
	gridicon: 'something-new',
	published: '2026-05-13T01:23:00.000Z',
	summary: 'A mystery event',
};

describe( 'normalizeEntry', () => {
	test( 'maps a backup entry to a backup ActivityItem', () => {
		const item = normalizeEntry( backupEntry );
		expect( item ).toMatchObject( {
			id: 'a-1',
			kind: 'backup',
			rewindId: '1777035492',
			// `stats` reads from `content.text`, NOT the JSON-encoded
			// `object.backup_stats`. Rendering backup_stats verbatim
			// would dump JSON into the UI.
			stats: '4 plugins, 1 theme, 20 uploads, 4 posts, 1 page',
			isComplete: true,
		} );
	} );

	test( 'maps a post entry to a post ActivityItem', () => {
		const item = normalizeEntry( postEntry );
		expect( item ).toMatchObject( { id: 'a-2', kind: 'post', actor: { type: 'Person' } } );
	} );

	test.each( Object.entries( OBSERVED_GRIDICONS.mapped ) )(
		'maps the live gridicon %s to kind %s',
		( gridicon, kind ) => {
			expect( normalizeEntry( { ...postEntry, gridicon } ) ).toMatchObject( { kind } );
		}
	);

	test.each( OBSERVED_GRIDICONS.unmapped )(
		'maps the unmapped live gridicon %s to other rather than dropping it',
		gridicon => {
			expect( normalizeEntry( { ...postEntry, gridicon } ) ).toMatchObject( { kind: 'other' } );
		}
	);

	test( 'maps an entirely unknown gridicon to other', () => {
		expect( normalizeEntry( unknownEntry ) ).toMatchObject( { id: 'a-3', kind: 'other' } );
	} );

	test( 'falls back to activity_id when rewind_id is missing', () => {
		const fallback = { ...backupEntry, rewind_id: undefined };
		expect( normalizeEntry( fallback ) ).toMatchObject( { kind: 'backup', rewindId: 'a-1' } );
	} );
} );

describe( 'normalizeActivityLog', () => {
	test( 'returns an empty array for undefined input', () => {
		expect( normalizeActivityLog( undefined ) ).toEqual( [] );
	} );

	test( 'is length-preserving so the row count matches the advertised total', () => {
		// The pagination footer renders `totalItems` from the server
		// envelope. Any entry normalize drops here makes the rendered
		// list shorter than the count the footer promises.
		const entries = [ backupEntry, postEntry, unknownEntry ];
		const items = normalizeActivityLog( entries );

		expect( items ).toHaveLength( entries.length );
		expect( items.map( i => i.kind ) ).toEqual( [ 'backup', 'post', 'other' ] );
	} );
} );
