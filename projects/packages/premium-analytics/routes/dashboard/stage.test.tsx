/**
 * External dependencies
 */
import { useReportScope } from '@jetpack-premium-analytics/data';
import { render, screen } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { DATE_FILTER_RANGE, DATE_FILTER_YEAR } from './config';
import { useActiveSection, useDashboardSections, useSectionDateFilter } from './hooks';
import { stage as Dashboard } from './stage';
import type { ReactNode } from 'react';

jest.mock( '@jetpack-premium-analytics/data', () => ( {
	...jest.requireActual( '@jetpack-premium-analytics/data' ),
	GlobalErrorProvider: ( { children }: { children: ReactNode } ) => <>{ children }</>,
} ) );

jest.mock( '@jetpack-premium-analytics/externals', () => ( {
	Stack: ( { children }: { children: ReactNode } ) => <div>{ children }</div>,
} ) );

jest.mock( '@jetpack-premium-analytics/routing', () => ( {
	...jest.requireActual( '@jetpack-premium-analytics/routing' ),
	useReportDateFilters: () => ( {
		appliedRange: { from: undefined, to: undefined },
		range: { from: undefined, to: undefined },
		timeZone: 'UTC',
		intervalOptions: [],
		onChange: jest.fn(),
		onApply: jest.fn(),
		onIntervalChange: jest.fn(),
	} ),
} ) );

jest.mock( '@jetpack-premium-analytics/ui', () => ( {
	DateFiltersPanel: () => <MockHeaderScopeProbe />,
	DateIntervalDropdown: () => null,
	DateYearFilter: () => null,
	SectionHeader: ( { children }: { children: ReactNode } ) => <div>{ children }</div>,
	SectionTabPanel: ( { children }: { children: ReactNode } ) => <div>{ children }</div>,
	StatsBreadcrumbs: () => null,
	StatsPageIcon: () => null,
	getSectionSubtitle: () => '',
} ) );

jest.mock( '@wordpress/admin-ui', () => ( {
	Page: ( { children }: { children: ReactNode } ) => <div>{ children }</div>,
} ) );

jest.mock( '@wordpress/components', () => ( {
	Spinner: () => null,
} ) );

jest.mock( '@wordpress/core-data', () => ( { store: {} } ) );

jest.mock( '@wordpress/data', () => ( { useSelect: () => [] } ) );

/**
 * Reads the scope the dashboard declares, from where the header's date controls
 * render. Both halves derive from the one declaration, so the header reads it
 * rather than being handed a prop.
 *
 * @return The declared scope, as text.
 */
function MockHeaderScopeProbe() {
	const { offersComparison } = useReportScope();

	return (
		<span>{ offersComparison ? 'header offers comparison' : 'header offers no comparison' }</span>
	);
}

/**
 * Reads the scope the dashboard declares, from where the widgets actually render.
 *
 * @return The declared scope, as text.
 */
function MockScopeProbe() {
	const { offersComparison } = useReportScope();

	return <span>{ offersComparison ? 'offers comparison' : 'no comparison' }</span>;
}

jest.mock( '@wordpress/widget-dashboard', () => {
	const WidgetDashboard = ( { children }: { children: ReactNode } ) => <div>{ children }</div>;
	WidgetDashboard.Actions = () => null;
	WidgetDashboard.NoWidgetsState = () => null;
	WidgetDashboard.Widgets = () => <MockScopeProbe />;
	WidgetDashboard.Commands = () => null;

	return { WidgetDashboard };
} );

jest.mock( './components', () => ( {
	DashboardSections: ( { children }: { children: ReactNode } ) => <div>{ children }</div>,
} ) );

jest.mock( '../widget-module-i18n', () => ( {
	resolveWidgetModuleWithI18n: jest.fn(),
	useWidgetTypesWithI18n: () => [ [], false ],
} ) );

jest.mock( './hooks', () => ( {
	useActiveSection: jest.fn(),
	useDashboardGridSettings: () => [ {} ],
	useDashboardSectionLayout: () => [ [], jest.fn(), jest.fn() ],
	useDashboardSections: jest.fn(),
	useSectionDateFilter: jest.fn(),
} ) );

const useDashboardSectionsMock = jest.mocked( useDashboardSections );
const useSectionDateFilterMock = jest.mocked( useSectionDateFilter );
const useActiveSectionMock = jest.mocked( useActiveSection );

/**
 * Resolve the sections entity with one active section.
 *
 * @param overrides - Fields to override on that section.
 */
function mockSection( overrides: Record< string, unknown > = {} ) {
	useDashboardSectionsMock.mockReturnValue( {
		sections: [
			{
				slug: 'insights',
				label: 'Insights',
				title: 'Activity insights',
				date_filter: DATE_FILTER_YEAR,
				...overrides,
			},
		],
		hasResolved: true,
	} as unknown as ReturnType< typeof useDashboardSections > );
}

describe( 'Dashboard report scope', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		useActiveSectionMock.mockReturnValue( [ 'insights', jest.fn() ] );
	} );

	it( 'declares no comparison for a section whose header offers none', () => {
		mockSection();
		useSectionDateFilterMock.mockReturnValue( DATE_FILTER_YEAR );

		render( <Dashboard /> );

		expect( screen.getByText( 'no comparison' ) ).toBeInTheDocument();
	} );

	it( 'declares a comparison for a section whose header offers one', () => {
		mockSection( { date_filter: DATE_FILTER_RANGE } );
		useSectionDateFilterMock.mockReturnValue( DATE_FILTER_RANGE );

		render( <Dashboard /> );

		expect( screen.getByText( 'offers comparison' ) ).toBeInTheDocument();
		expect( screen.getByText( 'header offers comparison' ) ).toBeInTheDocument();
	} );

	it( 'declares no comparison for a range section that opted out', () => {
		mockSection( {
			date_filter: DATE_FILTER_RANGE,
			date_filter_options: { with_date_comparison: false },
		} );
		useSectionDateFilterMock.mockReturnValue( DATE_FILTER_RANGE );

		render( <Dashboard /> );

		expect( screen.getByText( 'no comparison' ) ).toBeInTheDocument();
		expect( screen.getByText( 'header offers no comparison' ) ).toBeInTheDocument();
	} );

	it( 'updates the scope when switching between sections', () => {
		useDashboardSectionsMock.mockReturnValue( {
			sections: [
				{
					slug: 'traffic',
					label: 'Traffic',
					title: 'Traffic',
					date_filter: DATE_FILTER_RANGE,
				},
				{
					slug: 'insights',
					label: 'Insights',
					title: 'Activity insights',
					date_filter: DATE_FILTER_YEAR,
				},
			],
			hasResolved: true,
		} as unknown as ReturnType< typeof useDashboardSections > );
		useActiveSectionMock.mockReturnValue( [ 'traffic', jest.fn() ] );
		useSectionDateFilterMock.mockReturnValue( DATE_FILTER_RANGE );
		const { rerender } = render( <Dashboard /> );

		expect( screen.getByText( 'offers comparison' ) ).toBeInTheDocument();

		useActiveSectionMock.mockReturnValue( [ 'insights', jest.fn() ] );
		useSectionDateFilterMock.mockReturnValue( DATE_FILTER_YEAR );
		rerender( <Dashboard /> );
		expect( screen.getByText( 'no comparison' ) ).toBeInTheDocument();

		useActiveSectionMock.mockReturnValue( [ 'traffic', jest.fn() ] );
		useSectionDateFilterMock.mockReturnValue( DATE_FILTER_RANGE );
		rerender( <Dashboard /> );
		expect( screen.getByText( 'offers comparison' ) ).toBeInTheDocument();
	} );
} );
