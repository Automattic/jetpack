/**
 * Internal dependencies
 */
import { TILE_ROWS } from '../../config';
import { heightOf, settleTileHeights } from './settle-tile-heights';
import type { DashboardWidget } from '@wordpress/widget-dashboard';

const tile = (
	uuid: string,
	type: DashboardWidget[ 'type' ],
	height: number
): DashboardWidget => ( {
	uuid,
	type,
	placement: { width: 1, height },
} );

describe( 'settleTileHeights', () => {
	const sectionDefault = [ tile( 'default-posts', 'jpa/stats-top-posts', TILE_ROWS.list ) ];
	const previous = [ tile( 'posts', 'jpa/stats-top-posts', TILE_ROWS.list ) ];

	it.each( [
		[
			'an inserted widget at the package height takes its default-layout height',
			[ ...previous, tile( 'new-posts', 'jpa/stats-top-posts', 2 ) ],
			[ TILE_ROWS.list, TILE_ROWS.list ],
		],
		[
			'an inserted widget outside the default layout takes the card height',
			[ ...previous, tile( 'new-clicks', 'jpa/clicks', 2 ) ],
			[ TILE_ROWS.list, TILE_ROWS.card ],
		],
		[
			'a widget resized below the strip height stops at the strip',
			[ tile( 'posts', 'jpa/stats-top-posts', 1 ) ],
			[ TILE_ROWS.strip ],
		],
		[
			'a widget resized to the strip height keeps it',
			[ tile( 'posts', 'jpa/stats-top-posts', TILE_ROWS.strip ) ],
			[ TILE_ROWS.strip ],
		],
	] )( '%s', ( _name, next, heights ) => {
		expect( settleTileHeights( next, previous, sectionDefault ).map( heightOf ) ).toEqual(
			heights
		);
	} );

	it( 'hands back the same layout when every height clears the floor', () => {
		const next = [ ...previous, tile( 'clicks', 'jpa/clicks', TILE_ROWS.card ) ];

		expect( settleTileHeights( next, previous, sectionDefault ) ).toBe( next );
	} );

	it( 'leaves a widget without a numeric height alone', () => {
		const next: DashboardWidget[] = [ { uuid: 'bare', type: 'jpa/clicks' } ];

		expect( settleTileHeights( next, previous, sectionDefault ) ).toBe( next );
	} );
} );
