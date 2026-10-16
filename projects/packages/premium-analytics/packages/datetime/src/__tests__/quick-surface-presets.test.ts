/**
 * Internal dependencies
 */
import { computePrimaryRange, getQuickSurfacePresets } from '../presets';
import { PRESET_ALL_TIME, QUICK_SURFACE_PRESETS } from '../presets/types';
import { dateToISOStringWithTZ } from '../tz';

// A zone ahead of UTC, so a naive (UTC) day boundary would land on the wrong
// day: 2026-07-08T10:29:35Z is already the 8th's evening in Taipei.
const TIME_ZONE = 'Asia/Taipei';
const PUBLISHED = new Date( '2026-07-08T10:29:35.000Z' );

const NOW = new Date( '2026-08-25T04:00:00.000Z' );

beforeAll( () => {
	jest.useFakeTimers().setSystemTime( NOW );
} );

afterAll( () => {
	jest.useRealTimers();
} );

describe( 'quick surface presets', () => {
	it( 'lists the rolling windows by default, with no all-time pill', () => {
		expect( getQuickSurfacePresets( TIME_ZONE ).map( preset => preset.id ) ).toEqual( [
			...QUICK_SURFACE_PRESETS,
		] );
	} );

	it( 'names every period in full', () => {
		expect( getQuickSurfacePresets( TIME_ZONE ).map( preset => preset.label ) ).toEqual( [
			'Last 24 hours',
			'Last 7 days',
			'Last 30 days',
			'Last 12 months',
		] );
	} );

	it( 'anchors all time on the site-local start of the given day, through the end of today', () => {
		const [ allTime ] = getQuickSurfacePresets( TIME_ZONE, {
			presetIds: [ PRESET_ALL_TIME ],
			startDate: PUBLISHED,
		} );

		expect( dateToISOStringWithTZ( allTime.range.from, TIME_ZONE ) ).toBe(
			'2026-07-08T00:00:00.000+08:00'
		);
		expect( dateToISOStringWithTZ( allTime.range.to, TIME_ZONE ) ).toBe(
			'2026-08-25T23:59:59.999+08:00'
		);
	} );

	it( 'computes the same anchored range for the preset ID', () => {
		const range = computePrimaryRange( PRESET_ALL_TIME, TIME_ZONE, { startDate: PUBLISHED } );

		expect( dateToISOStringWithTZ( range!.from, TIME_ZONE ) ).toBe(
			'2026-07-08T00:00:00.000+08:00'
		);
	} );

	it( 'falls back to the year surface span without an anchor', () => {
		const [ allTime ] = getQuickSurfacePresets( TIME_ZONE, { presetIds: [ PRESET_ALL_TIME ] } );

		expect( allTime.range ).toEqual( computePrimaryRange( PRESET_ALL_TIME, TIME_ZONE ) );
		// Years back, not the day the test pinned.
		expect( allTime.range.from.getTime() ).toBeLessThan( PUBLISHED.getTime() );
	} );
} );
