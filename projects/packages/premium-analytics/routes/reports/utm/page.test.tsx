/**
 * External dependencies
 */
import { ReportDrilldownTable } from '@jetpack-premium-analytics/widgets-toolkit';
import { render } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { useUtmReportRecords } from './config';
import UtmReportPage from './page';
import type { UtmReportRow } from './config';
import type { ReactNode } from 'react';

jest.mock( './config', () => ( {
	getReportUtmTabs: () => [ { id: 'source-medium', label: 'Source / medium' } ],
	getTabTitle: () => 'Source / medium',
	getUtmFields: () => [],
	getUtmTabLabel: () => 'Source / medium',
	resolveSection: ( value: string | undefined ) => value ?? 'source-medium',
	useUtmReportRecords: jest.fn(),
} ) );

jest.mock( '@jetpack-premium-analytics/routing', () => ( {
	...jest.requireActual( '@jetpack-premium-analytics/routing' ),
	useDashboardLink: () => '/',
	useReportDateFilters: () => ( {} ),
	useSectionTab: () => [ 'source-medium', jest.fn() ],
} ) );

jest.mock( '@jetpack-premium-analytics/ui', () => ( {
	DateFiltersPanel: () => null,
	StatsBreadcrumbs: () => null,
	StatsPageIcon: () => null,
} ) );

jest.mock( '@jetpack-premium-analytics/widgets-toolkit', () => ( {
	ReportCsvAction: () => null,
	ReportDrilldownTable: jest.fn( () => null ),
	ReportErrorState: () => null,
	ReportPageLayout: ( { children }: { children: ReactNode } ) => <>{ children }</>,
	ReportPageShell: ( { children }: { children: ReactNode } ) => <>{ children }</>,
	ReportPageTabs: () => null,
	useReportCsvExport: () => ( { canExport: false, rows: [], filename: 'utm' } ),
	useReportRetry: ( refetch: () => unknown ) => refetch,
} ) );

jest.mock( '@wordpress/route', () => ( {
	useSearch: () => ( {
		from: '2026-06-01',
		to: '2026-06-07',
		interval: 'day',
	} ),
} ) );

const useRecordsMock = jest.mocked( useUtmReportRecords );
const reportDrilldownTableMock = jest.mocked( ReportDrilldownTable );

const row: UtmReportRow = {
	id: 'utm_source=newsletter',
	label: 'newsletter',
	isGroup: true,
	views: 42,
};

describe( 'UtmReportPage', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	it( 'opens folded to its top-level UTM values', () => {
		useRecordsMock.mockReturnValue( {
			isError: false,
			refetch: jest.fn(),
			rows: [ row ],
			hasComparison: false,
			isLoading: false,
			isFetching: false,
		} as unknown as ReturnType< typeof useUtmReportRecords > );

		render( <UtmReportPage /> );

		expect( reportDrilldownTableMock.mock.calls[ 0 ][ 0 ] ).toEqual(
			expect.objectContaining( {
				data: [ row ],
				collapsible: true,
				defaultExpanded: 'none',
			} )
		);
	} );
} );
