import { normalizeActivityLog, normalizeEntry } from '../activity-log';
import type { WpcomActivityEntry } from '../../api/activity-log';

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
	gridicon: 'post',
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
		expect( item ).not.toBeNull();
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

	test( 'returns null for unknown gridicons', () => {
		expect( normalizeEntry( unknownEntry ) ).toBeNull();
	} );

	test( 'falls back to activity_id when rewind_id is missing', () => {
		const fallback = { ...backupEntry, rewind_id: undefined };
		const item = normalizeEntry( fallback );
		expect( item ).toMatchObject( { kind: 'backup', rewindId: 'a-1' } );
	} );
} );

describe( 'normalizeActivityLog', () => {
	test( 'returns an empty array for undefined input', () => {
		expect( normalizeActivityLog( undefined ) ).toEqual( [] );
	} );

	test( 'filters out unmapped gridicons', () => {
		const items = normalizeActivityLog( [ backupEntry, postEntry, unknownEntry ] );
		expect( items ).toHaveLength( 2 );
		expect( items.map( i => i.kind ) ).toEqual( [ 'backup', 'post' ] );
	} );
} );
