import { jest } from '@jest/globals';
import { renderHook } from '@testing-library/react';
import type { OverviewResponse } from '../overview-types';
import type { SettingsResponse } from '../settings-types';

// True-ESM Jest (`--experimental-vm-modules`): register the mocks with
// `jest.unstable_mockModule` and import the module under test dynamically after.
const getOverview = jest.fn< () => OverviewResponse | null >();
const getSettings = jest.fn< () => SettingsResponse | null >();

jest.unstable_mockModule( '../get-overview', () => ( {
	default: getOverview,
} ) );
jest.unstable_mockModule( '../settings-store', () => ( {
	settingsStore: 'jetpack-seo/settings',
} ) );
jest.unstable_mockModule( '@wordpress/data', () => ( {
	select: () => ( { getSettings } ),
	useSelect: ( map: ( select: () => { getSettings: typeof getSettings } ) => unknown ) =>
		map( () => ( { getSettings } ) ),
} ) );

const { default: isSeoToolsActive, useSeoToolsActive } = await import( '../is-seo-tools-active' );

const overviewWith = ( active: boolean ) =>
	( { site_visibility: { seo_tools_active: active } } ) as OverviewResponse;
const settingsWith = ( active: boolean ) => ( { seo_tools_active: active } ) as SettingsResponse;

describe( 'isSeoToolsActive and useSeoToolsActive', () => {
	it.each( [
		[ 'the switch turned it on', settingsWith( true ), overviewWith( false ), true ],
		[ 'the switch turned it off', settingsWith( false ), overviewWith( true ), false ],
		[ 'no settings, Overview on', null, overviewWith( true ), true ],
		[ 'no settings, Overview off', null, overviewWith( false ), false ],
		[ 'no bootstrap at all', null, null, false ],
	] )( '%s', ( _case, settings, overview, expected ) => {
		getSettings.mockReturnValue( settings );
		getOverview.mockReturnValue( overview );

		expect( isSeoToolsActive() ).toBe( expected );
		expect( renderHook( () => useSeoToolsActive() ).result.current ).toBe( expected );
	} );
} );
