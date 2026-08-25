/**
 * External dependencies
 */
import { renderHook } from '@testing-library/react';
import { DETAIL_SURFACE_PRESETS } from '@jetpack-premium-analytics/datetime';
/**
 * Internal dependencies
 */
import { useDetailDatePresets } from './use-detail-date-presets';

describe( 'useDetailDatePresets', () => {
	it( 'offers the detail presets with no custom range, anchored on the publish date', () => {
		const { result } = renderHook( () => useDetailDatePresets( '2026-07-08T10:29:35' ) );

		expect( result.current.presetIds ).toBe( DETAIL_SURFACE_PRESETS );
		expect( result.current.withCustomRange ).toBe( false );
		expect( result.current.allTimeStart ).toEqual( new Date( '2026-07-08T10:29:35' ) );
	} );

	it( 'leaves all time unanchored while the publish date is unknown or unreadable', () => {
		expect(
			renderHook( () => useDetailDatePresets( undefined ) ).result.current.allTimeStart
		).toBeUndefined();
		expect(
			renderHook( () => useDetailDatePresets( 'not a date' ) ).result.current.allTimeStart
		).toBeUndefined();
	} );
} );
