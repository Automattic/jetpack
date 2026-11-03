import { dispatch } from '@wordpress/data';
import { getSettings, setSettings } from '@wordpress/date';
import { store as preferencesStore } from '@wordpress/preferences';
import { DASHBOARD_PREFERENCES_SCOPE, type StatsDatePolicy } from '@jetpack-premium-analytics/data';
import { seedSiteDateParams } from './site-date-seed';

type PreferencesActions = { set: ( scope: string, name: string, value: unknown ) => void };

const remember = ( name: string, value: unknown ) =>
	( dispatch( preferencesStore ) as unknown as PreferencesActions ).set(
		DASHBOARD_PREFERENCES_SCOPE,
		name,
		value
	);

// "Today" is 2026-02-18 in the site zone, so last-7-days runs Feb 12 to Feb 18.
const NOW = new Date( '2026-02-18T17:00:00.000Z' );

describe( 'seedSiteDateParams', () => {
	const originalSettings = getSettings();

	beforeAll( () => {
		setSettings( {
			...originalSettings,
			timezone: { string: 'America/New_York', offset: -5, offsetFormatted: '-5', abbr: 'EST' },
		} );
	} );

	beforeEach( () => {
		jest.useFakeTimers().setSystemTime( NOW );
	} );

	afterEach( () => {
		jest.useRealTimers();
		remember( 'comparison', undefined );
		remember( 'datePreset', undefined );
	} );

	afterAll( () => {
		setSettings( originalSettings );
	} );

	it( 'compares a fresh load with the previous period', () => {
		expect( seedSiteDateParams( { section: 'traffic' } ) ).toMatchObject( {
			preset: 'last-7-days',
			from: '2026-02-12T00:00:00.000-05:00',
			to: '2026-02-18T23:59:59.999-05:00',
			comp: '1',
			compare_preset: 'previous-period',
			compare_from: '2026-02-05T00:00:00.000-05:00',
			compare_to: '2026-02-11T23:59:59.999-05:00',
		} );
	} );

	it( 'leaves a fresh load uncompared once the reader chose No comparison', () => {
		remember( 'comparison', 'none' );

		const seeded = seedSiteDateParams( { section: 'traffic' } );

		expect( seeded.preset ).toBe( 'last-7-days' );
		expect( seeded.comp ).toBeUndefined();
		expect( seeded.compare_from ).toBeUndefined();
	} );

	it( 'compares a fresh load with the remembered comparison', () => {
		remember( 'comparison', 'previous-year' );

		expect( seedSiteDateParams( { section: 'traffic' } ) ).toMatchObject( {
			comp: '1',
			compare_preset: 'previous-year',
			compare_from: '2025-02-12T00:00:00.000-05:00',
			compare_to: '2025-02-18T23:59:59.999-05:00',
		} );
	} );

	it( 'falls back to the previous period when the range does not offer the remembered one', () => {
		remember( 'comparison', 'previous-week' );
		remember( 'datePreset', 'last-30-days' );

		expect( seedSiteDateParams( { section: 'traffic' } ) ).toMatchObject( {
			preset: 'last-30-days',
			compare_preset: 'previous-period',
		} );
	} );

	// A reload after "No comparison" carries dates; a detail page's way back, a preset alone.
	it.each( [
		[ 'dates', { from: '2026-02-01T00:00:00.000-05:00', to: '2026-02-07T23:59:59.999-05:00' } ],
		[ 'a preset', { preset: 'last-7-days' } ],
	] )( 'leaves a URL naming its window by %s uncompared', ( _label, search ) => {
		const seeded = seedSiteDateParams( search );

		expect( seeded.comp ).toBeUndefined();
		expect( seeded.compare_from ).toBeUndefined();
	} );

	it( "opens a fresh load on the plan's default preset, compared", () => {
		const policy: StatsDatePolicy = {
			feature: 'long-date-presets',
			lockedPresetIds: [ 'last-12-months' ],
			fallbackPresetId: 'last-30-days',
			lockedIntervals: [],
			offersComparison: true,
		};
		remember( 'datePreset', 'last-12-months' );

		expect( seedSiteDateParams( { section: 'traffic' }, policy ) ).toMatchObject( {
			preset: 'last-30-days',
			comp: '1',
			compare_preset: 'previous-period',
		} );
	} );

	it( 'leaves a fresh load uncompared on a plan that offers no comparison', () => {
		const policy: StatsDatePolicy = {
			feature: 'recent-7-days',
			earliestDate: new Date( '2026-02-12T05:00:00.000Z' ),
			lockedPresetIds: [ 'last-30-days' ],
			fallbackPresetId: 'last-7-days',
			lockedIntervals: [],
			offersComparison: false,
		};

		const seeded = seedSiteDateParams( { section: 'traffic' }, policy );

		expect( seeded.preset ).toBe( 'last-7-days' );
		expect( seeded.comp ).toBeUndefined();
	} );

	it( 'keeps the comparison a fresh URL already carries', () => {
		const seeded = seedSiteDateParams( {
			comp: '1',
			compare_from: '2025-02-18T00:00:00.000-05:00',
			compare_to: '2025-02-18T23:59:59.999-05:00',
			compare_preset: 'previous-year',
		} );

		expect( seeded ).toMatchObject( {
			compare_from: '2025-02-18T00:00:00.000-05:00',
			compare_preset: 'previous-year',
		} );
	} );
} );
