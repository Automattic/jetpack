/**
 * External dependencies
 */
import {
	useStatsDevices,
	useStatsDevicesPeriods,
	useStatsSite,
} from '@jetpack-premium-analytics/data';
import { screen } from '@testing-library/react';
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
	useStatsDevicesPeriods: jest.fn(),
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
		primary: { data: {}, isError: false, isPlaceholderData: false },
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

function devicesPeriodsResult(
	primary: Record< string, unknown >,
	comparison = {},
	overrides: Record< string, unknown > = {}
) {
	return {
		primary: { data: primary, isError: false, isPlaceholderData: false },
		comparison: { data: comparison },
		hasComparison: true,
		timezone: 'UTC',
		periodStarts: undefined,
		isLoading: false,
		isFetching: false,
		isError: false,
		error: null,
		refetch: jest.fn(),
		...overrides,
	} as unknown as ReturnType< typeof useStatsDevicesPeriods >;
}

const BUCKET = { date_start: '2026-07-01T00:00:00', date_end: '2026-07-01T23:59:59' };
const RANGE = { date_start: '2026-07-01', date_end: '2026-07-31' };

function renderWidget( attributes = {} ) {
	return renderWithActionsHost(
		<DevicesWidget attributes={ { ...attributes, reportParams: REPORT_PARAMS } } />
	);
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
		[
			'the segments on screen are the previous range’s',
			devicesResult( ROWS, { primary: { data: {}, isError: false, isPlaceholderData: true } } ),
		],
	] )( 'offers no download when %s', ( _, result ) => {
		mockUseStatsDevices.mockReturnValue( result );

		const { declaredAction } = renderWidget();

		expect( declaredAction( 'download-csv' ) ).toBeUndefined();
	} );

	it( 'still offers the download when only the comparison period failed', async () => {
		mockUseStatsDevices.mockReturnValue( devicesResult( ROWS, { isError: true } ) );

		const { findDeclaredAction } = renderWidget();

		await expect( findDeclaredAction( 'download-csv' ) ).resolves.toBeDefined();
	} );
} );

describe( 'DevicesWidget bar chart', () => {
	let downloads: ReturnType< typeof captureCsvDownloads > | undefined;

	beforeEach( () => {
		jest.useFakeTimers();
		jest.mocked( useStatsDevicesPeriods ).mockReset();
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

	it( 'saves each bucket with its views per screen size, without the previous period', async () => {
		downloads = captureCsvDownloads();
		jest.mocked( useStatsDevicesPeriods ).mockReturnValue(
			devicesPeriodsResult(
				{
					summary: { desktop: 40, mobile: 20, ...RANGE },
					data: [ { ...BUCKET, desktop: 40, mobile: 20 } ],
				},
				{ summary: { desktop: 30, ...RANGE }, data: [ { ...BUCKET, desktop: 30 } ] }
			)
		);

		const { findDeclaredAction } = renderWidget( { chartType: 'bar' } );
		await downloads.runAndSave( await findDeclaredAction( 'download-csv' ) );

		expect( downloads.files[ 0 ].filename ).toBe( 'devices-over-time-2026-07-01_2026-07-31.csv' );
		await expect( downloads.lines() ).resolves.toEqual( [
			'"Date","Desktop","Mobile"',
			'"2026-07-01","40","20"',
		] );
	} );

	it( 'offers no download when only the previous period recorded views', () => {
		jest
			.mocked( useStatsDevicesPeriods )
			.mockReturnValue(
				devicesPeriodsResult(
					{ summary: { ...RANGE }, data: [ { ...BUCKET } ] },
					{ summary: { desktop: 30, ...RANGE }, data: [ { ...BUCKET, desktop: 30 } ] }
				)
			);

		const { declaredAction } = renderWidget( { chartType: 'bar' } );

		expect( declaredAction( 'download-csv' ) ).toBeUndefined();
	} );

	it.each( [
		[
			'offers no Retry for a permission-gated 403',
			{ status: 403, code: 'rest_forbidden' },
			false,
		],
		[ 'offers Retry for a failure that can heal', { status: 403, code: 'no_connection' }, true ],
	] )( '%s', ( _case, error, retry ) => {
		jest
			.mocked( useStatsDevicesPeriods )
			.mockReturnValue(
				devicesPeriodsResult( { summary: { ...RANGE }, data: [] }, {}, { isError: true, error } )
			);

		renderWidget( { chartType: 'bar' } );

		expect( Boolean( screen.queryByRole( 'button', { name: 'Retry' } ) ) ).toBe( retry );
	} );
} );
