/**
 * External dependencies
 */
import { useSectionTab } from '@jetpack-premium-analytics/routing';
import { ReportPageTabs, ReportRecordsTable } from '@jetpack-premium-analytics/widgets-toolkit';
import { act, render, screen } from '@testing-library/react';
import { useState } from 'react';
/**
 * Internal dependencies
 */
import { useTagsReportRecords } from './config';
import TagsReportPage from './page';
import type { TagsReportTabId } from './config';
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
	ReportPageLayout: ( {
		title,
		tabs,
		children,
	}: {
		title: string;
		tabs: ReactNode;
		children: ReactNode;
	} ) => (
		<>
			<h1>{ title }</h1>
			{ tabs }
			{ children }
		</>
	),
	ReportPageTabs: jest.fn( () => null ),
	ReportRecordsTable: jest.fn( () => <div data-testid="records-table" /> ),
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
const reportPageTabsMock = jest.mocked( ReportPageTabs );
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
		'titles and labels the %s tab and asks for its rows',
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

	it( 'switches tabs through the tab strip and starts the table afresh', () => {
		useSectionTabMock.mockImplementation(
			() => useState< TagsReportTabId >( 'all' ) as ReturnType< typeof useSectionTab >
		);

		render( <TagsReportPage /> );
		const table = screen.getByTestId( 'records-table' );
		const { tabs, value, onChange } = reportPageTabsMock.mock.lastCall![ 0 ];

		expect( tabs.map( tab => tab.id ) ).toEqual( [ 'all', 'tags', 'categories' ] );
		expect( value ).toBe( 'all' );

		act( () => onChange( 'categories' ) );

		expect( reportPageTabsMock.mock.lastCall?.[ 0 ].value ).toBe( 'categories' );
		expect( useRecordsMock ).toHaveBeenLastCalledWith( expect.anything(), 'category' );
		expect( screen.getByTestId( 'records-table' ) ).not.toBe( table );
	} );
} );
