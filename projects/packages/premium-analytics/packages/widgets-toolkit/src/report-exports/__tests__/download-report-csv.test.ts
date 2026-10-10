/**
 * Internal dependencies
 */
import * as buildCsvModule from '../../helpers/build-csv';
import { downloadReportCsv } from '../download-report-csv';
import type { ReportCsvExporter } from '../types';
import type { ReportParams } from '@jetpack-premium-analytics/data';

jest.mock(
	'@automattic/jetpack-script-data',
	() => jest.requireActual( '../../../../../tests/js/script-data-test-utils' ).mockJetpackScriptData
);
jest.mock( '@jetpack-premium-analytics/data', () => ( {
	...jest.requireActual( '@jetpack-premium-analytics/data' ),
	downloadReport: jest.fn(),
} ) );

type Row = { name: string; count: number };

function buildExporter(
	overrides: Partial< ReportCsvExporter< Row, Row > > = {}
): ReportCsvExporter< Row, Row > {
	return {
		filenamePrefix: 'things',
		hasDateRange: true,
		fetchItems: jest.fn().mockResolvedValue( [
			{ name: 'b', count: 1 },
			{ name: 'a', count: 2 },
		] ),
		toCsvRows: items => [ ...items ].reverse(),
		getColumns: () => [
			{ label: 'Name', getValue: row => row.name },
			{ label: 'Count', getValue: row => row.count },
		],
		...overrides,
	};
}

const REPORT_PARAMS = { from: '2026-03-01', to: '2026-03-10', interval: 'day' } as ReportParams;

describe( 'downloadReportCsv', () => {
	let mockSaveCsv: jest.SpiedFunction< typeof buildCsvModule.saveCsv >;

	beforeEach( () => {
		jest.clearAllMocks();
		mockSaveCsv = jest.spyOn( buildCsvModule, 'saveCsv' ).mockImplementation( () => {} );
	} );

	afterEach( () => {
		mockSaveCsv.mockRestore();
	} );

	it( 'saves the fetched rows through the exporter, with a dated filename', async () => {
		const exporter = buildExporter();

		await downloadReportCsv( exporter, REPORT_PARAMS );

		expect( exporter.fetchItems ).toHaveBeenCalledWith( REPORT_PARAMS );
		expect( mockSaveCsv ).toHaveBeenCalledWith(
			'things-2026-03-01_2026-03-10',
			'"Name","Count"\n"a","2"\n"b","1"'
		);
	} );

	it( 'leaves the date range out for all-time reports', async () => {
		await downloadReportCsv( buildExporter( { hasDateRange: false } ), REPORT_PARAMS );

		expect( mockSaveCsv ).toHaveBeenCalledWith( 'things', expect.any( String ) );
	} );

	it( 'rejects instead of saving a header-only file when the fetch fails', async () => {
		const exporter = buildExporter( {
			fetchItems: jest.fn().mockRejectedValue( new Error( 'Stats is down' ) ),
		} );

		await expect( downloadReportCsv( exporter, REPORT_PARAMS ) ).rejects.toThrow( 'Stats is down' );
		expect( mockSaveCsv ).not.toHaveBeenCalled();
	} );
} );
