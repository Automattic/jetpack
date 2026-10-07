import { getSettings, setSettings } from '@wordpress/date';
import { seedReportDateParams } from './report-date-seed';

// "Today" is 2026-02-18 in the site zone, so last-30-days runs Jan 20 to Feb 18.
const NOW = new Date( '2026-02-18T17:00:00.000Z' );

describe( 'seedReportDateParams', () => {
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
	} );

	afterAll( () => {
		setSettings( originalSettings );
	} );

	it( 'compares a fresh load with the previous period', () => {
		expect( seedReportDateParams( { section: 'traffic' } ) ).toMatchObject( {
			preset: 'last-30-days',
			from: '2026-01-20T00:00:00.000-05:00',
			to: '2026-02-18T23:59:59.999-05:00',
			comp: '1',
			compare_preset: 'previous-period',
			compare_from: '2025-12-21T00:00:00.000-05:00',
			compare_to: '2026-01-19T23:59:59.999-05:00',
		} );
	} );

	// A URL that already names its range is a deep link or a reload after
	// "No comparison", and must stay uncompared.
	it( 'leaves a URL with its own range uncompared', () => {
		const seeded = seedReportDateParams( {
			from: '2026-02-01T00:00:00.000-05:00',
			to: '2026-02-07T23:59:59.999-05:00',
		} );

		expect( seeded.comp ).toBeUndefined();
		expect( seeded.compare_from ).toBeUndefined();
	} );

	it( 'keeps the comparison a fresh URL already carries', () => {
		const seeded = seedReportDateParams( {
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
