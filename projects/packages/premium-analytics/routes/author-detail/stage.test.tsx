import { useReportScope } from '@jetpack-premium-analytics/data';
import { useStoredDetailLayout } from '@jetpack-premium-analytics/widgets-toolkit';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useAuthorSummary } from './hooks';
import { stage } from './stage';
import type { ReactNode } from 'react';

let mockSearch: Record< string, unknown > = {};

// The dashboard props the stage handed to the (mocked) WidgetDashboard.
let mockDashboardProps: {
	editMode?: boolean;
	onEditChange?: ( next: boolean ) => void;
	onLayoutChange?: ( next: unknown ) => void;
	onLayoutReset?: () => void;
} = {};

jest.mock( '@jetpack-premium-analytics/data', () => ( {
	...jest.requireActual( '@jetpack-premium-analytics/data' ),
	AnalyticsQueryClientProvider: ( { children }: { children: ReactNode } ) => <>{ children }</>,
	GlobalErrorProvider: ( { children }: { children: ReactNode } ) => <>{ children }</>,
} ) );

jest.mock( '@jetpack-premium-analytics/routing', () => ( {
	// Spreads the real module so the tab configs (which call `defineReportTabs`)
	// resolve, and `buildReportLink`/`pickReportDateParams` build real hrefs below.
	...jest.requireActual( '@jetpack-premium-analytics/routing' ),
	useDashboardLink: () => '/?from=2026-06-01&to=2026-06-16',
	useReportDateFilters: () => ( {
		appliedRange: { from: new Date( 2026, 5, 1 ), to: new Date( 2026, 5, 16 ) },
		replaceRange: () => {},
		timeZone: 'UTC',
		interval: 'day',
		intervalOptions: [ 'day', 'week' ],
	} ),
} ) );

// Avoid loading DataViews while keeping the real breadcrumbs for these assertions.
jest.mock( '@jetpack-premium-analytics/ui', () => ( {
	DateFiltersPanel: () => <div>Date filters</div>,
	SectionHeader: jest.requireActual( '../../packages/ui/src/section-header' ).SectionHeader,
	StatsBreadcrumbs: jest.requireActual( '../../packages/ui/src/stats-breadcrumbs' )
		.StatsBreadcrumbs,
	StatsPageIcon: () => null,
} ) );

// The core-data selector the stage's `useSelect` callback reaches.
const mockGetEntityRecords = jest.fn( () => [] );

jest.mock( '@wordpress/core-data', () => ( {
	store: {},
} ) );

// Falls through to the real module except `useSelect`: the externals path pulls
// in `@wordpress/rich-text`, whose store calls `combineReducers` at import time,
// so `requireActual` must stay lazy or it re-enters the module mid-init.
jest.mock(
	'@wordpress/data',
	() =>
		new Proxy(
			{
				useSelect: ( selector: ( select: unknown ) => unknown ) =>
					selector( () => ( { getEntityRecords: mockGetEntityRecords } ) ),
			},
			{
				get: ( overrides, prop ) =>
					prop in overrides
						? overrides[ prop as keyof typeof overrides ]
						: jest.requireActual( '@wordpress/data' )[ prop ],
			}
		)
);

/**
 * Reads the scope from where the page's widgets render.
 *
 * @return The declared scope, as text.
 */
function MockScopeProbe() {
	const { offersComparison } = useReportScope();

	return (
		<>
			<div>Author widgets</div>
			<div>{ offersComparison ? 'Scope offers comparison' : 'Scope offers no comparison' }</div>
		</>
	);
}

// Captures each render's `layout` prop so tests can assert what the page hands
// the dashboard.
const mockDashboardLayouts: unknown[] = [];
jest.mock( '@wordpress/widget-dashboard', () => {
	const WidgetDashboard = ( {
		children,
		layout,
		editMode,
		onEditChange,
		onLayoutChange,
		onLayoutReset,
	}: {
		children: ReactNode;
		layout?: unknown;
		editMode?: boolean;
		onEditChange?: ( next: boolean ) => void;
		onLayoutChange?: ( next: unknown ) => void;
		onLayoutReset?: () => void;
	} ) => {
		mockDashboardLayouts.push( layout );
		mockDashboardProps = { editMode, onEditChange, onLayoutChange, onLayoutReset };
		return <>{ children }</>;
	};
	WidgetDashboard.Widgets = () => <MockScopeProbe />;
	WidgetDashboard.Actions = () => <div data-testid="dashboard-actions" />;
	WidgetDashboard.Policy = ( { children }: { children: ReactNode } ) => <>{ children }</>;

	return { WidgetDashboard, DEFAULT_GRID: {}, ROW_HEIGHT_PRESETS: { small: 200 } };
} );

// The stored arrangement is the toolkit's; the rest of the toolkit stays real.
jest.mock( '@jetpack-premium-analytics/widgets-toolkit', () => ( {
	...jest.requireActual( '@jetpack-premium-analytics/widgets-toolkit' ),
	useStoredDetailLayout: jest.fn( ( scope: string, layoutId: string, fixed: unknown ) => ( {
		layout: fixed,
		setLayout: () => {},
		resetLayout: () => {},
		hasCustomLayout: false,
	} ) ),
} ) );

const mockUseStoredLayout = useStoredDetailLayout as jest.Mock;

jest.mock( '@wordpress/widget-primitives', () => ( {
	useWidgetTypes: () => [ [], false ],
} ) );

// The report registry is deliberately not mocked so the breadcrumb exercises
// the real report-origin validation.

jest.mock( '@wordpress/admin-ui', () => ( {
	Breadcrumbs: ( { items }: { items: Array< { label: string; to?: string } > } ) => (
		<nav aria-label="Breadcrumbs">
			{ items.map( ( item, index ) => {
				let content: ReactNode = item.label;
				if ( item.to ) {
					content = <a href={ item.to }>{ item.label }</a>;
				} else if ( index === items.length - 1 ) {
					content = <h1>{ item.label }</h1>;
				}

				return (
					<span key={ index } role="listitem">
						{ content }
					</span>
				);
			} ) }
		</nav>
	),
	Page: ( {
		breadcrumbs,
		actions,
		children,
	}: {
		breadcrumbs: ReactNode;
		actions?: ReactNode;
		children: ReactNode;
	} ) => (
		<main>
			{ breadcrumbs }
			<div data-testid="page-actions">{ actions }</div>
			{ children }
		</main>
	),
} ) );

jest.mock( '@wordpress/route', () => {
	const { mockWordPressRoute } = jest.requireActual( '../../tests/js/route-test-utils' );

	return {
		Link: mockWordPressRoute.Link,
		useParams: () => ( { authorId: '7' } ),
		useSearch: () => mockSearch,
	};
} );

jest.mock( './hooks', () => ( {
	useAuthorSummary: jest.fn(),
} ) );

const mockUseAuthorSummary = useAuthorSummary as jest.Mock;
const refetch = jest.fn();

/**
 * Stubs the author summary hook, defaulting to a resolved author.
 *
 * @param overrides - Fields to override on the default summary.
 */
function mockSummary( overrides: Record< string, unknown > = {} ) {
	mockUseAuthorSummary.mockReturnValue( {
		name: 'Priya Patel',
		avatarUrl: 'https://secure.gravatar.com/avatar/abc?s=96',
		postCount: 4,
		firstPublishedDate: '2023-07-04T10:00:00',
		isLoading: false,
		isError: false,
		isNotFound: false,
		refetch,
		...overrides,
	} );
}

describe( 'author detail stage', () => {
	// The Authors report behind the crumb reads the preview scope off script data;
	// the page options menu reads the reader's capabilities off it too.
	beforeAll( () => {
		Object.defineProperty( window, 'JetpackScriptData', {
			configurable: true,
			value: { premium_analytics: {}, user: { current_user: { capabilities: {} } } },
		} );
	} );

	beforeEach( () => {
		jest.clearAllMocks();
		mockDashboardLayouts.length = 0;
		mockSearch = { from: '2026-06-01', to: '2026-06-16', author_id: '7' };
	} );

	afterAll( () => {
		delete window.JetpackScriptData;
	} );

	/**
	 * Find the summary heading. The breadcrumb's trailing crumb is the page's
	 * `h1`; the header titles the section under it.
	 *
	 * @param name - The accessible heading name.
	 * @return The summary heading.
	 */
	function getSummaryHeading( name: string ): HTMLElement {
		return screen.getByRole( 'heading', { level: 2, name } );
	}

	it( 'renders the fixed Stats / All authors / Author trail with date-preserving links', () => {
		mockSummary();

		render( stage() );

		const breadcrumbs = within( screen.getByRole( 'navigation', { name: 'Breadcrumbs' } ) );
		expect( breadcrumbs.getAllByRole( 'listitem' ).map( crumb => crumb.textContent ) ).toEqual( [
			'Stats',
			'All authors',
			'Author',
		] );
		expect( breadcrumbs.getByRole( 'link', { name: 'Stats' } ) ).toHaveAttribute(
			'href',
			'/?from=2026-06-01&to=2026-06-16'
		);
		expect( breadcrumbs.getByRole( 'link', { name: 'All authors' } ) ).toHaveAttribute(
			'href',
			'/reports/authors?from=2026-06-01&to=2026-06-16'
		);
		expect( breadcrumbs.getByRole( 'heading', { level: 1, name: 'Author' } ) ).toBeInTheDocument();
	} );

	it( 'asks core-data for every widget module, not its default first page', () => {
		mockSummary();

		render( stage() );

		expect( mockGetEntityRecords ).toHaveBeenCalledWith( 'root', 'widgetModule', {
			per_page: -1,
		} );
	} );

	it( 'shows the author identity in the header and renders the widgets', () => {
		mockSummary();

		render( stage() );

		expect( getSummaryHeading( 'Priya Patel' ) ).toBeInTheDocument();
		expect( screen.getByText( '4 posts · writing since July 2023' ) ).toBeInTheDocument();
		expect( screen.getByRole( 'presentation', { hidden: true } ) ).toHaveAttribute(
			'src',
			'https://secure.gravatar.com/avatar/abc?s=96'
		);
		expect( screen.getByText( 'Author widgets' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Date filters' ) ).toBeInTheDocument();
	} );

	it( 'swaps a broken avatar for the placeholder glyph', () => {
		mockSummary();

		render( stage() );

		const avatar = screen.getByRole( 'presentation', { hidden: true } );
		fireEvent.error( avatar );

		expect( screen.queryByRole( 'presentation', { hidden: true } ) ).not.toBeInTheDocument();
		expect(
			// eslint-disable-next-line testing-library/no-node-access -- The aria-hidden placeholder has no accessible query target.
			document.querySelector( 'div[aria-hidden="true"] svg' )
		).toBeInTheDocument();
	} );

	it( 'shows a not-found state with a date-preserving link back to Authors', () => {
		mockSummary( { isNotFound: true, name: undefined } );

		render( stage() );

		expect( screen.getByText( "We couldn't find this author." ) ).toBeInTheDocument();
		expect( screen.getByRole( 'link', { name: 'Back to Authors' } ) ).toHaveAttribute(
			'href',
			'/reports/authors?from=2026-06-01&to=2026-06-16'
		);
		expect( getSummaryHeading( 'Author not found' ) ).toBeInTheDocument();
		expect( screen.queryByText( 'Author widgets' ) ).not.toBeInTheDocument();
	} );

	it( 'offers Retry when the summary fails, keeping the trail and date controls', async () => {
		const user = userEvent.setup();
		mockSummary( { isError: true, name: undefined } );

		render( stage() );

		expect( getSummaryHeading( 'Author unavailable' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Date filters' ) ).toBeInTheDocument();
		const breadcrumbs = within( screen.getByRole( 'navigation', { name: 'Breadcrumbs' } ) );
		expect( breadcrumbs.getAllByRole( 'listitem' ) ).toHaveLength( 3 );

		await user.click( screen.getByRole( 'button', { name: 'Retry' } ) );
		expect( refetch ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'names the page while loading', () => {
		mockSummary( { isLoading: true, name: undefined } );

		render( stage() );

		expect( getSummaryHeading( 'Loading…' ) ).toBeInTheDocument();
		expect( screen.queryByText( 'Author widgets' ) ).not.toBeInTheDocument();
	} );

	it( 'declares no comparison for the widgets it renders', () => {
		mockSummary();
		mockSearch = {
			...mockSearch,
			comp: '1',
			compare_from: '2026-05-17',
			compare_to: '2026-05-31',
		};

		render( stage() );

		expect( screen.getByText( 'Scope offers no comparison' ) ).toBeInTheDocument();
	} );

	it( 'hands the dashboard its fixed layout under its own preferences scope', () => {
		mockSummary();

		render( stage() );

		expect( mockUseStoredLayout ).toHaveBeenCalledWith(
			'jetpack-premium-analytics/author-detail',
			'author',
			expect.any( Array )
		);
		const layout = mockDashboardLayouts.at( -1 ) as Array< { type: string } >;
		expect( layout.map( widget => widget.type ) ).toEqual( [
			'jpa/author-views',
			'jpa/popular-post--author',
			'jpa/latest-post--author',
			'jpa/author-top-posts',
		] );
	} );

	it( 'offers Customize only once the author resolves', async () => {
		const user = userEvent.setup();
		mockSummary( { isNotFound: true, name: undefined } );

		const { unmount } = render( stage() );
		await user.click( screen.getByRole( 'button', { name: 'Page options' } ) );
		await expect(
			screen.findByRole( 'menuitem', { name: 'Any feedback?' } )
		).resolves.toBeInTheDocument();
		expect( screen.queryByRole( 'menuitem', { name: 'Customize' } ) ).not.toBeInTheDocument();
		unmount();

		mockSummary();
		render( stage() );
		await user.click( screen.getByRole( 'button', { name: 'Page options' } ) );
		await user.click( await screen.findByRole( 'menuitem', { name: 'Customize' } ) );

		expect( mockDashboardProps.editMode ).toBe( true );
		expect( screen.getByTestId( 'dashboard-actions' ) ).toBeInTheDocument();

		act( () => mockDashboardProps.onEditChange?.( false ) );
		expect( mockDashboardProps.editMode ).toBe( false );
	} );
} );
