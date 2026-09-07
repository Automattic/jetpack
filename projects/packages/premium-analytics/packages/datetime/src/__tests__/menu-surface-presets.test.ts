/**
 * Internal dependencies
 */
import { getMenuSurfacePresetGroups } from '../presets';
import { PRESET_ALL_TIME, MENU_SURFACE_PRESETS } from '../presets/types';

const TIME_ZONE = 'America/New_York';

const idsOf = ( groups: { id: string }[][] ) =>
	groups.map( group => group.map( ( { id } ) => id ) );

describe( 'getMenuSurfacePresetGroups', () => {
	it( 'groups the periods by scale, narrowest first', () => {
		expect( idsOf( getMenuSurfacePresetGroups( TIME_ZONE ) ) ).toEqual( [
			[
				'today',
				'yesterday',
				'last-24-hours',
				'last-7-days',
				'last-30-days',
				'last-90-days',
				'last-365-days',
			],
			[ 'last-month' ],
			[ 'last-12-months', 'last-year' ],
		] );
	} );

	// Only a surface with a start date to anchor it can offer one.
	it( 'leaves all time out unless the surface asks for it', () => {
		const groups = getMenuSurfacePresetGroups( TIME_ZONE, {
			presetIds: [ ...MENU_SURFACE_PRESETS, PRESET_ALL_TIME ],
			startDate: new Date( '2024-03-01T00:00:00.000Z' ),
		} );

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
			'Last 90 days',
			'Last 365 days',
		] );

		for ( const preset of days ) {
			expect( preset.range.from ).toBeInstanceOf( Date );
			expect( preset.range.to ).toBeInstanceOf( Date );
		}
	} );
} );
