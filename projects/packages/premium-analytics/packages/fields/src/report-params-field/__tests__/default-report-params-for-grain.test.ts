/**
 * Internal dependencies
 */
import { defaultReportParamsForGrain } from '../report-params-field';

const mockGetDefaultReportParams = jest.fn();

jest.mock( '@jetpack-premium-analytics/data', () => ( {
	...jest.requireActual( '@jetpack-premium-analytics/data' ),
	getDefaultReportParams: () => mockGetDefaultReportParams(),
} ) );

const DAILY_GRAIN = {
	presetIds: [ 'last-7-days', 'last-30-days', 'last-12-months' ],
} as const;

describe( 'defaultReportParamsForGrain', () => {
	it( 'keeps the store default when the widget offers it', () => {
		mockGetDefaultReportParams.mockReturnValue( { preset: 'last-30-days' } );

		expect( defaultReportParamsForGrain( DAILY_GRAIN ) ).toEqual( { preset: 'last-30-days' } );
	} );

	// A site launched today defaults to `today`, which a report with no sub-daily
	// bucket would draw as a single point.
	it( 'falls back to the first offered window when the store default is not offered', () => {
		mockGetDefaultReportParams.mockReturnValue( { preset: 'today' } );

		expect( defaultReportParamsForGrain( DAILY_GRAIN ) ).toEqual( { preset: 'last-7-days' } );
	} );

	it( 'keeps the store default for a grain that names no windows', () => {
		mockGetDefaultReportParams.mockReturnValue( { preset: 'today' } );

		expect( defaultReportParamsForGrain() ).toEqual( { preset: 'today' } );
	} );
} );
