import { render, screen } from '@testing-library/react';
import { usePostSummary } from './hooks';
import { stage } from './stage';
import type { ReactNode } from 'react';

jest.mock( '@jetpack-premium-analytics/data', () => ( {
	AnalyticsQueryClientProvider: ( { children }: { children: ReactNode } ) => <>{ children }</>,
	GlobalErrorProvider: ( { children }: { children: ReactNode } ) => <>{ children }</>,
} ) );

jest.mock( '@jetpack-premium-analytics/routing', () => ( {
	useDashboardLink: () => '/?from=2026-06-01&to=2026-06-16',
	useReportDateFilters: () => ( {} ),
} ) );

jest.mock( '@jetpack-premium-analytics/ui', () => ( {
	DateFiltersPanel: () => <div>Date filters</div>,
	SectionTabPanel: ( { children }: { children: ReactNode } ) => <div>{ children }</div>,
	// The real guard is covered in the ui package; keep the scheme check here so
	// the header still refuses a non-http URL.
	safeHttpUrl: ( value?: string | null ) =>
		value && /^https?:\/\//.test( value ) ? value : undefined,
} ) );

jest.mock( '@wordpress/core-data', () => ( { store: {} } ) );

// Falls through to the real module for everything but `useSelect`. Reaching the
// externals passthrough pulls `@wordpress/components` -> `@wordpress/rich-text`
// into the graph, whose store calls `combineReducers` at import time; a
// `useSelect`-only mock leaves that undefined and the suite fails to load.
// `requireActual` has to stay lazy — calling it in the factory body re-enters
// the module while it is still initialising.
jest.mock(
	'@wordpress/data',
	() =>
		new Proxy(
			{ useSelect: () => [] },
			{
				get: ( overrides, prop ) =>
					prop in overrides
						? overrides[ prop as keyof typeof overrides ]
						: jest.requireActual( '@wordpress/data' )[ prop ],
			}
		)
);

jest.mock( '@wordpress/widget-dashboard', () => {
	const WidgetDashboard = ( { children }: { children: ReactNode } ) => <>{ children }</>;
	WidgetDashboard.Widgets = () => <div>Post widgets</div>;

	return {
		WidgetDashboard,
		DEFAULT_GRID: {},
		ROW_HEIGHT_PRESETS: { small: 200 },
	};
} );

jest.mock( '@wordpress/widget-primitives', () => ( {
	useWidgetTypes: () => [ [], false ],
} ) );

jest.mock( '@wordpress/admin-ui', () => ( {
	Breadcrumbs: ( { items }: { items: Array< { label: string } > } ) => (
		<nav aria-label="Breadcrumbs">
			{ items.map( item => (
				<span key={ item.label } role="listitem">
					{ item.label }
				</span>
			) ) }
		</nav>
	),
	Page: ( {
		breadcrumbs,
		actions,
		children,
	}: {
		breadcrumbs: ReactNode;
		actions: ReactNode;
		children: ReactNode;
	} ) => (
		<main>
			{ breadcrumbs }
			<div data-testid="page-actions">{ actions }</div>
			{ children }
		</main>
	),
} ) );

jest.mock( '@wordpress/route', () => ( {
	useParams: () => ( { postId: '41' } ),
} ) );

jest.mock( './components', () => ( {
	PostDetailTabs: ( { children }: { children: ReactNode } ) => <div>{ children }</div>,
	PostSummaryCard: () => <div>Post summary</div>,
} ) );

jest.mock( './hooks', () => ( {
	usePostSummary: jest.fn(),
	usePostDetailTabs: () => ( {
		tabs: [],
		activeTab: 'traffic',
		setActiveTab: jest.fn(),
		layout: [],
	} ),
} ) );

const mockUsePostSummary = usePostSummary as jest.Mock;

/**
 * Stub the post summary hook, defaulting to a resolved post with a public URL.
 *
 * @param overrides - Fields to override on the default summary.
 */
function mockSummary( overrides: Record< string, unknown > = {} ) {
	mockUsePostSummary.mockReturnValue( {
		title: 'Hello world',
		type: 'post',
		publishedDate: '2026-06-22 18:00:00',
		imageUrl: undefined,
		url: 'https://example.com/hello-world/',
		isLoading: false,
		...overrides,
	} );
}

describe( 'post detail stage', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	it( 'puts a View post action in the page header, opening the live post in a new tab', () => {
		mockSummary();

		render( stage() );

		const action = screen.getByRole( 'link', { name: 'View post' } );
		expect( action ).toHaveAttribute( 'href', 'https://example.com/hello-world/' );
		expect( action ).toHaveAttribute( 'target', '_blank' );
		expect( action ).toHaveAttribute( 'rel', 'noopener noreferrer' );
	} );

	it( 'labels the action View page for a page', () => {
		mockSummary( { type: 'page', url: 'https://example.com/about/' } );

		render( stage() );

		expect( screen.getByRole( 'link', { name: 'View page' } ) ).toHaveAttribute(
			'href',
			'https://example.com/about/'
		);
		expect( screen.queryByRole( 'link', { name: 'View post' } ) ).not.toBeInTheDocument();
	} );

	it( 'omits the action while the post URL is unresolved', () => {
		mockSummary( { url: undefined } );

		render( stage() );

		expect( screen.queryByRole( 'link', { name: /^View (post|page)$/ } ) ).not.toBeInTheDocument();
	} );

	it( 'omits the action when the post URL carries an unsupported scheme', () => {
		mockSummary( { url: 'javascript:alert(1)' } );

		render( stage() );

		expect( screen.queryByRole( 'link', { name: /^View (post|page)$/ } ) ).not.toBeInTheDocument();
	} );

	it( 'renders the breadcrumb trail with the resolved title', () => {
		mockSummary();

		render( stage() );

		const nav = screen.getByRole( 'navigation', { name: 'Breadcrumbs' } );
		expect( nav ).toHaveTextContent( 'Stats' );
		expect( nav ).toHaveTextContent( 'Hello world' );
	} );
} );
