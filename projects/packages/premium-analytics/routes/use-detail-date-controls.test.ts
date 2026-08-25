/**
 * External dependencies
 */
import { renderHook } from '@testing-library/react';
import { DETAIL_SURFACE_PRESETS } from '@jetpack-premium-analytics/datetime';
/**
 * Internal dependencies
 */
import { useDetailDateControls } from './use-detail-date-controls';

describe( 'useDetailDateControls', () => {
	it( 'offers the preset pills alone, anchored on the publish date', () => {
		const { result } = renderHook( () => useDetailDateControls( '2026-07-08T10:29:35' ) );

		expect( result.current ).toEqual( {
			presetIds: DETAIL_SURFACE_PRESETS,
			allTimeStart: new Date( '2026-07-08T10:29:35' ),
			withCustomRange: false,
			withIntervalControl: false,
			onStep: undefined,
		} );
	} );

	it( 'leaves all time unanchored while the publish date is unknown or unreadable', () => {
		expect(
			renderHook( () => useDetailDateControls( undefined ) ).result.current.allTimeStart
		).toBeUndefined();
		expect(
			renderHook( () => useDetailDateControls( 'not a date' ) ).result.current.allTimeStart
		).toBeUndefined();
	} );
} );
