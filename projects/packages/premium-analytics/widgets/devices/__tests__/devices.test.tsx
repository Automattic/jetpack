/**
 * External dependencies
 */
import { useStatsDevices, useStatsSite } from '@jetpack-premium-analytics/data';
/**
 * Internal dependencies
 */
import { renderWithActionsHost } from '../../../tests/js/widget-host-test-utils';
import { captureCsvDownloads } from '../../test-utils';
import DevicesWidget from '../render';
import type { ReportParams } from '@jetpack-premium-analytics/data';

jest.mock( '@wordpress/route', () => jest.requireActual( '../../test-utils' ).mockWordPressRoute );

jest.mock( '@jetpack-premium-analytics/data', () => ( {
	...jest.requireActual( '@jetpack-premium-analytics/data' ),
	useStatsDevices: jest.fn(),
	useStatsSite: jest.fn(),
} ) );

const mockUseStatsDevices = jest.mocked( useStatsDevices );

const REPORT_PARAMS = {
	from: '2026-07-01',
	to: '2026-07-31',
	interval: 'day',
	comp: '1',
	compare_from: '2026-06-01',
	compare_to: '2026-06-30',
} as unknown as ReportParams;

const ROWS = [
	{ label: 'desktop', value: 62.5, previousValue: 60 },
	{ label: 'mobile', value: 37.5, previousValue: 40 },
];

function devicesResult( rows: unknown[], overrides: Record< string, unknown > = {} ) {
	return {
		primary: { data: {}, isError: false },
		comparisonRows: { rows, hasComparison: true },
		hasComparison: true,
		isLoading: false,
		isFetching: false,
		isError: false,
		error: null,
		refetch: jest.fn(),
		...overrides,
	} as unknown as ReturnType< typeof useStatsDevices >;
}

function renderWidget() {
	return renderWithActionsHost( <DevicesWidget attributes={ { reportParams: REPORT_PARAMS } } /> );
}

describe( 'DevicesWidget CSV download', () => {
	let downloads: ReturnType< typeof captureCsvDownloads > | undefined;

	beforeEach( () => {
		jest.useFakeTimers();
		mockUseStatsDevices.mockReset();
		jest.mocked( useStatsSite ).mockReturnValue( {
			isLoading: false,
			isError: false,
			data: undefined,
		} as unknown as ReturnType< typeof useStatsSite > );
	} );

	afterEach( () => {
		downloads?.restore();
		downloads = undefined;
		jest.useRealTimers();
	} );

	it( 'saves each screen size with its share of views, without the previous period', async () => {
		downloads = captureCsvDownloads();
		mockUseStatsDevices.mockReturnValue( devicesResult( ROWS ) );

		const { findDeclaredAction } = renderWidget();
		await downloads.runAndSave( await findDeclaredAction( 'download-csv' ) );

		expect( downloads.files[ 0 ].filename ).toBe( 'devices-2026-07-01_2026-07-31.csv' );
		await expect( downloads.lines() ).resolves.toEqual( [
			'"Screen size","Share (%)"',
			'"Desktop","62.5"',
			'"Mobile","37.5"',
		] );
	} );

	it.each( [
		[ 'no device recorded a view', devicesResult( [ { label: 'desktop', value: 0 } ] ) ],
		[
			'a refetch failed behind the segments on screen',
			devicesResult( ROWS, { isError: true, primary: { data: {}, isError: true } } ),
		],
	] )( 'offers no download when %s', ( _, result ) => {
		mockUseStatsDevices.mockReturnValue( result );

		const { declaredAction } = renderWidget();

		expect( declaredAction( 'download-csv' ) ).toBeUndefined();
	} );
} );
