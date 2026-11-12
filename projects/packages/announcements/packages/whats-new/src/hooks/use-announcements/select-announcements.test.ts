/**
 * Internal dependencies
 */
import { getAnnouncementsForContexts, selectTeaser } from './select-announcements';
import type { Announcement } from '../../types';

const announcement = ( overrides: Partial< Announcement > ): Announcement => ( {
	id: 'my-plugin/newest',
	date: '2026-11-20T00:00:00+00:00',
	title: 'Newest',
	excerpt: '',
	content: '',
	media: null,
	link: '',
	contexts: [ 'my-plugin' ],
	seen: false,
	...overrides,
} );

const older = announcement( { id: 'my-plugin/older', date: '2026-11-01T00:00:00+00:00' } );

describe( 'getAnnouncementsForContexts', () => {
	it( 'keeps the announcements of the host, newest first', () => {
		const records = [
			older,
			announcement( {
				id: 'another-plugin/newer-still',
				date: '2026-11-30T00:00:00+00:00',
				contexts: [ 'another-plugin' ],
			} ),
			announcement( { contexts: [ 'another-plugin', 'my-plugin' ] } ),
		];

		expect(
			getAnnouncementsForContexts( records, [ 'my-plugin' ] ).map( ( { id } ) => id )
		).toEqual( [ 'my-plugin/newest', 'my-plugin/older' ] );
		expect( records[ 0 ] ).toBe( older );
	} );
} );

describe( 'selectTeaser', () => {
	it.each< [ string, Announcement[], string[], string | null ] >( [
		[ 'the newest one while it is unseen', [ announcement( {} ), older ], [], 'my-plugin/newest' ],
		[
			'nothing once the newest is seen, whatever is older',
			[ announcement( { seen: true } ), older ],
			[],
			null,
		],
		[
			'nothing once the newest is marked in this page load',
			[ announcement( {} ), older ],
			[ 'my-plugin/newest' ],
			null,
		],
		[ 'nothing without announcements', [], [], null ],
	] )( 'teases %s', ( _case, announcements, markedIds, expected ) => {
		expect( selectTeaser( announcements, new Set( markedIds ) )?.id ?? null ).toBe( expected );
	} );
} );
