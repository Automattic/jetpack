/**
 * External dependencies
 */
import { getAllowedIntervalsForPreset } from '@jetpack-premium-analytics/data';
import { MENU_SURFACE_PRESETS_WITH_ALL_TIME } from '@jetpack-premium-analytics/datetime';
/**
 * Internal dependencies
 */
import { getStoryIntervalOptions } from '../stories/story-interval-options';

const SHORT = { from: '2026-08-01T00:00:00.000Z', to: '2026-08-07T23:59:59.999Z' };
const LONG = { from: '2020-01-01T00:00:00.000Z', to: '2026-08-07T23:59:59.999Z' };

// A preset the report params answer from its own name reads the same on any range.
// The rest are answered from the range, which the stand-in is never given.
const namedPresets = MENU_SURFACE_PRESETS_WITH_ALL_TIME.filter(
	presetId =>
		getAllowedIntervalsForPreset( presetId, SHORT.from, SHORT.to ).join() ===
		getAllowedIntervalsForPreset( presetId, LONG.from, LONG.to ).join()
);

describe( 'getStoryIntervalOptions', () => {
	it.each( namedPresets )( 'offers the buckets the report params allow for %s', presetId => {
		expect( getStoryIntervalOptions( presetId ) ).toEqual(
			getAllowedIntervalsForPreset( presetId, SHORT.from, SHORT.to )
		);
	} );
} );
