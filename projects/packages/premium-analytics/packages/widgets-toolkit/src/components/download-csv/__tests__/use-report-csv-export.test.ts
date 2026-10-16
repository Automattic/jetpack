/**
 * External dependencies
 */
import { getScriptData } from '@automattic/jetpack-script-data';
import { renderHook } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { useReportCsvExport } from '../use-report-csv-export';

jest.mock(
	'@automattic/jetpack-script-data',
	() =>
		jest.requireActual( '../../../../../../tests/js/script-data-test-utils' ).mockJetpackScriptData
);
jest.mock( '@jetpack-premium-analytics/data', () => ( {
	...jest.requireActual( '@jetpack-premium-analytics/data' ),
	downloadReport: jest.fn(),
} ) );

const mockGetScriptData = jest.mocked( getScriptData );
const DISABLED_SCRIPT_DATA = {
	premium_analytics: { csv_exports_enabled: false },
} as ReturnType< typeof getScriptData >;
const readyStatus = { isLoading: false, isFetching: false, isError: false };

describe( 'useReportCsvExport', () => {
	beforeEach( () => {
		mockGetScriptData.mockReturnValue( undefined );
	} );

	it( 'builds export values and sorts a copy of the rows', () => {
		const rows = [
			{ title: 'Lower', views: 4 },
			{ title: 'Higher', views: 12 },
		];
		const originalRows = [ ...rows ];

		const { result } = renderHook( () =>
			useReportCsvExport( {
				rows,
				filenamePrefix: 'top-posts',
				range: { from: '2026-06-01T00:00:00Z', to: '2026-06-30T23:59:59Z' },
				status: readyStatus,
				sort: ( a, b ) => b.views - a.views,
			} )
		);

		expect( result.current ).toEqual( {
			canExport: true,
			rows: [ rows[ 1 ], rows[ 0 ] ],
			filename: 'top-posts-2026-06-01_2026-06-30',
		} );
		expect( rows ).toEqual( originalRows );
	} );

	it( 'uses the prefix as the filename for an all-time report', () => {
		const rows = [ { title: 'Post', views: 1 } ];
		const { result } = renderHook( () =>
			useReportCsvExport( {
				rows,
				filenamePrefix: 'annual-insights',
				status: readyStatus,
			} )
		);

		expect( result.current.filename ).toBe( 'annual-insights' );
	} );

	it.each( [
		[ 'the server disables CSV exports', false, readyStatus, [ { title: 'Post', views: 1 } ] ],
		[ 'there are no rows', true, readyStatus, [] ],
		[
			'the report is loading',
			true,
			{ ...readyStatus, isLoading: true },
			[ { title: 'Post', views: 1 } ],
		],
		[
			'the report is fetching',
			true,
			{ ...readyStatus, isFetching: true },
			[ { title: 'Post', views: 1 } ],
		],
		[
			'the report failed',
			true,
			{ ...readyStatus, isError: true },
			[ { title: 'Post', views: 1 } ],
		],
	] )( 'disables export when %s', ( _label, enabled, status, rows ) => {
		mockGetScriptData.mockReturnValue( enabled ? undefined : DISABLED_SCRIPT_DATA );

		const { result } = renderHook( () =>
			useReportCsvExport( {
				rows,
				filenamePrefix: 'top-posts',
				range: { from: '2026-06-01', to: '2026-06-30' },
				status,
			} )
		);

		expect( result.current.canExport ).toBe( false );
	} );
} );
