/**
 * External dependencies
 */
import { getScriptData } from '@automattic/jetpack-script-data';
import { render } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { ExporterCsvAction } from '../exporter-csv-action';
import { ReportCsvAction } from '../report-csv-action';
import type {
	DatedReportCsvExporter,
	UndatedReportCsvExporter,
} from '../../../report-exports/types';
import type { ReportParams } from '@jetpack-premium-analytics/data';

jest.mock( '@automattic/jetpack-script-data', () => ( {
	getScriptData: jest.fn(),
} ) );
jest.mock( '../report-csv-action', () => ( {
	ReportCsvAction: jest.fn( () => null ),
} ) );

const reportCsvActionMock = jest.mocked( ReportCsvAction );

type Item = { name: string; count: number };

const REPORT_PARAMS = { from: '2026-03-01', to: '2026-03-10', interval: 'day' } as ReportParams;
const SETTLED = { isLoading: false, isFetching: false, isError: false };
const ITEMS: Item[] = [
	{ name: 'b', count: 1 },
	{ name: 'a', count: 2 },
];

const CSV_SHAPE = {
	fetchItems: jest.fn(),
	toCsvRows: ( items: Item[] ) => [ ...items ].sort( ( x, y ) => y.count - x.count ),
	getColumns: () => [ { label: 'Name', getValue: ( row: Item ) => row.name } ],
};

function buildExporter(): DatedReportCsvExporter< Item, Item > {
	return { filenamePrefix: 'things', hasDateRange: true, ...CSV_SHAPE };
}

function buildUndatedExporter(): UndatedReportCsvExporter< Item, Item > {
	return { filenamePrefix: 'things', hasDateRange: false, ...CSV_SHAPE };
}

describe( 'ExporterCsvAction', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		jest.mocked( getScriptData ).mockReturnValue( undefined );
	} );

	it( 'exports the loaded items through the exporter, with a dated filename', () => {
		render(
			<ExporterCsvAction
				exporter={ buildExporter() }
				items={ ITEMS }
				status={ SETTLED }
				reportParams={ REPORT_PARAMS }
			/>
		);

		const { columns, rows, filename } = reportCsvActionMock.mock.calls[ 0 ][ 0 ];
		expect( columns.map( column => column.label ) ).toEqual( [ 'Name' ] );
		expect( rows ).toEqual( [ ITEMS[ 1 ], ITEMS[ 0 ] ] );
		expect( filename ).toBe( 'things-2026-03-01_2026-03-10' );
	} );

	it( 'leaves the date range out for all-time reports', () => {
		render(
			<ExporterCsvAction exporter={ buildUndatedExporter() } items={ ITEMS } status={ SETTLED } />
		);

		expect( reportCsvActionMock.mock.calls[ 0 ][ 0 ].filename ).toBe( 'things' );
	} );

	it.each( [
		[ 'no rows', SETTLED, [] ],
		[ 'fetching', { ...SETTLED, isFetching: true }, ITEMS ],
		[ 'failed', { ...SETTLED, isError: true }, ITEMS ],
	] )( 'renders nothing while the report has %s', ( _state, status, items ) => {
		render(
			<ExporterCsvAction
				exporter={ buildExporter() }
				items={ items }
				status={ status }
				reportParams={ REPORT_PARAMS }
			/>
		);

		expect( reportCsvActionMock ).not.toHaveBeenCalled();
	} );
} );
