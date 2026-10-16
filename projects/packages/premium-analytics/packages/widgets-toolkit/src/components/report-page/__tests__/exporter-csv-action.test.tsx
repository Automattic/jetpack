/**
 * External dependencies
 */
import { getScriptData } from '@automattic/jetpack-script-data';
import { render } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { ExporterCsvAction } from '../exporter-csv-action';
import * as reportCsvActionModule from '../report-csv-action';
import type { ReportCsvExporter } from '../../../report-exports/types';
import type { ReportParams } from '@jetpack-premium-analytics/data';

jest.mock(
	'@automattic/jetpack-script-data',
	() =>
		jest.requireActual( '../../../../../../tests/js/script-data-test-utils' ).mockJetpackScriptData
);
jest.mock( '@jetpack-premium-analytics/data', () => ( {
	...jest.requireActual( '@jetpack-premium-analytics/data' ),
	downloadReport: jest.fn(),
} ) );

type Item = { name: string; count: number };

const REPORT_PARAMS = { from: '2026-03-01', to: '2026-03-10', interval: 'day' } as ReportParams;
const SETTLED = { isLoading: false, isFetching: false, isError: false };
const ITEMS: Item[] = [
	{ name: 'b', count: 1 },
	{ name: 'a', count: 2 },
];

function buildExporter(): ReportCsvExporter< Item, Item > {
	return {
		filenamePrefix: 'things',
		hasDateRange: true,
		fetchItems: jest.fn(),
		toCsvRows: items => [ ...items ].sort( ( x, y ) => y.count - x.count ),
		getColumns: () => [ { label: 'Name', getValue: row => row.name } ],
	};
}

describe( 'ExporterCsvAction', () => {
	let reportCsvActionMock: jest.SpiedFunction< typeof reportCsvActionModule.ReportCsvAction >;

	beforeEach( () => {
		jest.clearAllMocks();
		jest.mocked( getScriptData ).mockReturnValue( undefined );
		reportCsvActionMock = jest
			.spyOn( reportCsvActionModule, 'ReportCsvAction' )
			.mockImplementation( () => null );
	} );

	afterEach( () => {
		reportCsvActionMock.mockRestore();
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

	it.each( [
		[ 'no rows', SETTLED, [] ],
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
