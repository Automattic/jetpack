/**
 * External dependencies
 */
import { useSectionTab } from '@jetpack-premium-analytics/routing';
import { ReportRecordsTable } from '@jetpack-premium-analytics/widgets-toolkit';
import { render, screen } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { useTagsReportRecords } from './config';
import TagsReportPage from './page';
import type { ReactNode } from 'react';

jest.mock( './config', () => ( {
	...jest.requireActual( './config' ),
	useTagsReportRecords: jest.fn(),
} ) );

jest.mock( '@jetpack-premium-analytics/routing', () => ( {
	...jest.requireActual( '@jetpack-premium-analytics/routing' ),
	useDashboardLink: () => '/',
	useReportDateFilters: () => ( {} ),
	useSectionTab: jest.fn(),
} ) );

jest.mock( '@jetpack-premium-analytics/ui', () => ( {
	...jest.requireActual( '@jetpack-premium-analytics/ui' ),
	StatsBreadcrumbs: () => null,
} ) );

jest.mock( '@jetpack-premium-analytics/widgets-toolkit', () => ( {
	...jest.requireActual( '@jetpack-premium-analytics/widgets-toolkit' ),
	ExporterCsvAction: () => null,
	StatsOptionsMenu: () => null,
	ReportPageLayout: ( { title, children }: { title: string; children: ReactNode } ) => (
		<>
			<h1>{ title }</h1>
			{ children }
		</>
	),
	ReportPageTabs: () => null,
	ReportRecordsTable: jest.fn( () => null ),
} ) );

jest.mock( '@wordpress/admin-ui', () => ( {
	Page: ( { children }: { children: ReactNode } ) => <>{ children }</>,
} ) );

jest.mock(
	'@wordpress/route',
	() => jest.requireActual( '../../../tests/js/route-test-utils' ).mockWordPressRoute
);

const useRecordsMock = jest.mocked( useTagsReportRecords );
const useSectionTabMock = jest.mocked( useSectionTab );
const reportRecordsTableMock = jest.mocked( ReportRecordsTable );

describe( 'TagsReportPage', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		useRecordsMock.mockReturnValue( {
			rows: [],
			isLoading: false,
			isFetching: false,
			isError: false,
			error: null,
			refetch: jest.fn(),
		} as unknown as ReturnType< typeof useTagsReportRecords > );
	} );

	it.each( [
		[ 'all', undefined, 'Tags & categories', 'Tag or category', 'Search tags and categories' ],
		[ 'tags', 'tag', 'Tags', 'Tag', 'Search tags' ],
		[ 'categories', 'category', 'Categories', 'Category', 'Search categories' ],
	] as const )(
		'narrows the %s tab to its rows and names them',
		( section, termType, heading, column, search ) => {
			useSectionTabMock.mockReturnValue( [ section, jest.fn() ] );

			render( <TagsReportPage /> );

			expect( useRecordsMock ).toHaveBeenLastCalledWith( expect.anything(), termType );
			expect( screen.getByRole( 'heading', { name: heading } ) ).toBeInTheDocument();

			const props = reportRecordsTableMock.mock.lastCall?.[ 0 ];
			expect( props?.fields[ 0 ].label ).toBe( column );
			expect( props?.searchLabel ).toBe( search );
		}
	);
} );
