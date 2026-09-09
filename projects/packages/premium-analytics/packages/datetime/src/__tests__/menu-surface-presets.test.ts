/**
 * Internal dependencies
 */
import { getMenuSurfacePresetGroups } from '../presets';
import { DETAIL_SURFACE_PRESETS, MENU_SURFACE_PRESETS } from '../presets/types';

const TIME_ZONE = 'America/New_York';

const idsOf = ( groups: { id: string }[][] ) =>
	groups.map( group => group.map( ( { id } ) => id ) );

describe( 'getMenuSurfacePresetGroups', () => {
	it( 'groups the periods by scale, narrowest first', () => {
		expect( idsOf( getMenuSurfacePresetGroups( TIME_ZONE ) ) ).toEqual( [
			[ 'today', 'yesterday', 'last-24-hours', 'last-7-days', 'last-30-days' ],
			[ 'month-to-date', 'last-month' ],
			[ 'year-to-date', 'last-12-months' ],
		] );
	} );

	// Only a surface with a start date to anchor it can offer one.
	it( 'leaves all time out unless the surface asks for it', () => {
		expect( idsOf( getMenuSurfacePresetGroups( TIME_ZONE ) ).flat() ).not.toContain( 'all-time' );
	} );

	it( 'offers a detail surface every period the menu lists, all time last', () => {
		const groups = getMenuSurfacePresetGroups( TIME_ZONE, {
			presetIds: DETAIL_SURFACE_PRESETS,
			startDate: new Date( '2024-03-01T00:00:00.000Z' ),
		} );

		expect( idsOf( groups ).flat() ).toEqual( [
			...idsOf( getMenuSurfacePresetGroups( TIME_ZONE ) ).flat(),
			'all-time',
		] );
		expect( idsOf( groups ).at( -1 ) ).toEqual( [ 'all-time' ] );
	} );

	it( 'drops a group the surface offers nothing from', () => {
		const groups = getMenuSurfacePresetGroups( TIME_ZONE, {
			presetIds: [ 'today', 'last-7-days', 'last-12-months' ],
		} );

		expect( idsOf( groups ) ).toEqual( [ [ 'today', 'last-7-days' ], [ 'last-12-months' ] ] );
	} );

	// The menu owns the order: an offered list in another one does not reorder it.
	it( 'keeps its own order whatever order the surface asks in', () => {
		const groups = getMenuSurfacePresetGroups( TIME_ZONE, {
			presetIds: [ 'last-30-days', 'today', 'last-7-days' ],
		} );

		expect( idsOf( groups ) ).toEqual( [ [ 'today', 'last-7-days', 'last-30-days' ] ] );
	} );

	it( 'names every period in full and resolves its window', () => {
		const [ days ] = getMenuSurfacePresetGroups( TIME_ZONE );

		expect( days.map( preset => preset.label ) ).toEqual( [
			'Today',
			'Yesterday',
			'Last 24 hours',
			'Last 7 days',
			'Last 30 days',
		] );

		for ( const preset of days ) {
			expect( preset.range.from ).toBeInstanceOf( Date );
			expect( preset.range.to ).toBeInstanceOf( Date );
		}
	} );
} );
