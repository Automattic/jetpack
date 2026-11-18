/**
 * Internal dependencies
 */
import { getAnnouncementsForChannels, selectTeaser } from '../select-announcements';
import type { Announcement, SeenDates } from '../../../types';

const announcement = ( overrides: Partial< Announcement > ): Announcement => ( {
	id: 'my-plugin/newest',
	date: '2026-11-20T00:00:00+00:00',
	title: 'Newest',
	excerpt: '',
	content: '',
	media: null,
	link: '',
	channels: [ 'my-plugin' ],
	...overrides,
} );

const older = announcement( { id: 'my-plugin/older', date: '2026-11-01T00:00:00+00:00' } );

describe( 'getAnnouncementsForChannels', () => {
	it( 'keeps the announcements of the host, newest first', () => {
		const records = [
			older,
			announcement( {
				id: 'another-plugin/newer-still',
				date: '2026-11-30T00:00:00+00:00',
				channels: [ 'another-plugin' ],
			} ),
			announcement( { channels: [ 'another-plugin', 'my-plugin' ] } ),
		];

		expect(
			getAnnouncementsForChannels( records, [ 'my-plugin' ] ).map( ( { id } ) => id )
		).toEqual( [ 'my-plugin/newest', 'my-plugin/older' ] );
		expect( records[ 0 ] ).toBe( older );
	} );
} );

describe( 'selectTeaser', () => {
	it.each< [ string, Announcement[], SeenDates, string | null ] >( [
		[ 'the newest one while it is unseen', [ announcement( {} ), older ], {}, 'my-plugin/newest' ],
		[
			'nothing once the newest is seen, whatever is older',
			[ announcement( {} ), older ],
			{ 'my-plugin/newest': '2026-11-21T09:00:00.000Z' },
			null,
		],
		[
			'the newest one when only an older one is seen',
			[ announcement( {} ), older ],
			{ 'my-plugin/older': '2026-11-02T09:00:00.000Z' },
			'my-plugin/newest',
		],
		[ 'nothing without announcements', [], {}, null ],
	] )( 'teases %s', ( _case, announcements, seen, expected ) => {
		expect( selectTeaser( announcements, seen )?.id ?? null ).toBe( expected );
	} );
} );
