/**
 * Internal dependencies
 */
import { saveCsv } from '../../helpers/build-csv';
import { downloadReportCsv } from '../download-report-csv';
import type { DatedReportCsvExporter, UndatedReportCsvExporter } from '../types';
import type { ReportParams } from '@jetpack-premium-analytics/data';

jest.mock( '../../helpers/build-csv', () => ( {
	...jest.requireActual( '../../helpers/build-csv' ),
	saveCsv: jest.fn(),
} ) );

const mockSaveCsv = jest.mocked( saveCsv );

type Row = { name: string; count: number };

const ITEMS: Row[] = [
	{ name: 'b', count: 1 },
	{ name: 'a', count: 2 },
];

const CSV_SHAPE = {
	toCsvRows: ( items: Row[] ) => [ ...items ].reverse(),
	getColumns: () => [
		{ label: 'Name', getValue: ( row: Row ) => row.name },
		{ label: 'Count', getValue: ( row: Row ) => row.count },
	],
};

function buildExporter(
	fetchItems = jest.fn().mockResolvedValue( ITEMS )
): DatedReportCsvExporter< Row, Row > {
	return { filenamePrefix: 'things', hasDateRange: true, fetchItems, ...CSV_SHAPE };
}

function buildUndatedExporter(): UndatedReportCsvExporter< Row, Row > {
	return {
		filenamePrefix: 'things',
		hasDateRange: false,
		fetchItems: jest.fn().mockResolvedValue( ITEMS ),
		...CSV_SHAPE,
	};
}

const REPORT_PARAMS = { from: '2026-03-01', to: '2026-03-10', interval: 'day' } as ReportParams;

describe( 'downloadReportCsv', () => {
	beforeEach( () => {
		jest.clearAllMocks();
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

	it( 'fetches an all-time report without params and leaves the date range out', async () => {
		const exporter = buildUndatedExporter();

		await downloadReportCsv( exporter, REPORT_PARAMS );

		expect( exporter.fetchItems ).toHaveBeenCalledWith();
		expect( mockSaveCsv ).toHaveBeenCalledWith( 'things', '"Name","Count"\n"a","2"\n"b","1"' );
	} );

	it( 'rejects instead of saving a header-only file when the fetch fails', async () => {
		const exporter = buildExporter( jest.fn().mockRejectedValue( new Error( 'Stats is down' ) ) );

		await expect( downloadReportCsv( exporter, REPORT_PARAMS ) ).rejects.toThrow( 'Stats is down' );
		expect( mockSaveCsv ).not.toHaveBeenCalled();
	} );
} );
