import { render, screen, within } from '@testing-library/react';
import { useVideoSummary } from './hooks';
import { stage } from './stage';
import type { ReactNode } from 'react';

jest.mock( '@jetpack-premium-analytics/data', () => ( {
	AnalyticsQueryClientProvider: ( { children }: { children: ReactNode } ) => <>{ children }</>,
	GlobalErrorProvider: ( { children }: { children: ReactNode } ) => <>{ children }</>,
} ) );

jest.mock( '@jetpack-premium-analytics/routing', () => ( {
	pickReportDateParams: ( search: Record< string, unknown > ) => ( {
		from: search.from,
		to: search.to,
	} ),
	useDashboardLink: () => '/?from=2026-06-01&to=2026-06-16',
} ) );

jest.mock( '@wordpress/core-data', () => ( {
	store: {},
} ) );

jest.mock( '@wordpress/data', () => ( {
	useSelect: () => [],
} ) );

jest.mock( '@wordpress/widget-dashboard', () => {
	const WidgetDashboard = ( { children }: { children: ReactNode } ) => <>{ children }</>;
	WidgetDashboard.Widgets = () => <div>Video widgets</div>;

	return { WidgetDashboard };
} );

jest.mock( '@wordpress/widget-primitives', () => ( {
	useWidgetTypes: () => [ [], false ],
} ) );

jest.mock( '../dashboard/hooks/use-dashboard-grid-settings', () => ( {
	useDashboardGridSettings: () => [ {} ],
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
	Page: ( { breadcrumbs, children }: { breadcrumbs: ReactNode; children: ReactNode } ) => (
		<main>
			{ breadcrumbs }
			{ children }
		</main>
	),
} ) );

jest.mock( '@wordpress/route', () => ( {
	Link: ( {
		to,
		params,
		search,
		children,
	}: {
		to: string;
		params?: Record< string, unknown >;
		search?: Record< string, unknown >;
		children: ReactNode;
	} ) => {
		const path = Object.entries( params ?? {} ).reduce(
			( acc, [ key, value ] ) => acc.replace( `$${ key }`, String( value ) ),
			to
		);
		const query = new URLSearchParams(
			Object.entries( search ?? {} ).map( ( [ key, value ] ) => [ key, String( value ) ] )
		).toString();

		return <a href={ query ? `${ path }?${ query }` : path }>{ children }</a>;
	},
	useParams: () => ( { videoId: '42' } ),
	useSearch: () => ( {
		from: '2026-06-01',
		to: '2026-06-16',
		section: 'embeds',
	} ),
} ) );

jest.mock( './hooks', () => ( {
	useVideoSummary: jest.fn(),
} ) );

const mockUseVideoSummary = useVideoSummary as jest.Mock;
const refetch = jest.fn();

/**
 * Stubs the video summary hook, defaulting to a resolved video with no title.
 *
 * @param overrides - Fields to override on the default summary.
 */
function mockSummary( overrides: Record< string, unknown > = {} ) {
	mockUseVideoSummary.mockReturnValue( {
		title: undefined,
		publishedDate: undefined,
		isLoading: false,
		isError: false,
		isNotFound: false,
		refetch,
		...overrides,
	} );
}

describe( 'video detail stage', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	it( 'shows a not-found state with a date-preserving link back to Videos', () => {
		mockSummary( { isNotFound: true } );

		render( stage() );

		expect( screen.getByText( "We couldn't find this video." ) ).toBeInTheDocument();
		expect( screen.getByRole( 'link', { name: 'Back to Videos' } ) ).toHaveAttribute(
			'href',
			'/reports/videos?from=2026-06-01&to=2026-06-16'
		);
		expect( screen.queryByRole( 'heading', { level: 1 } ) ).not.toBeInTheDocument();
	} );

	it.each( [ { isLoading: true }, { isError: true }, { isNotFound: true } ] )(
		'shows only the Stats crumb and does not mount widgets while no video is available',
		summary => {
			mockSummary( summary );

			render( stage() );

			const nav = screen.getByRole( 'navigation', { name: 'Breadcrumbs' } );
			// Only the Stats crumb renders until a title resolves.
			const crumbs = within( nav ).getAllByRole( 'listitem' );
			expect( crumbs ).toHaveLength( 1 );
			expect( crumbs[ 0 ] ).toHaveTextContent( 'Stats' );
			expect( screen.queryByRole( 'heading', { level: 1 } ) ).not.toBeInTheDocument();
			expect( screen.queryByText( 'Video widgets' ) ).not.toBeInTheDocument();
		}
	);

	it( 'adds the resolved title crumb', () => {
		mockSummary( { title: 'Launch recap' } );

		render( stage() );

		const breadcrumbs = within( screen.getByRole( 'navigation', { name: 'Breadcrumbs' } ) );
		expect( breadcrumbs.getByText( 'Stats' ) ).toBeInTheDocument();
		expect( breadcrumbs.getByText( 'Launch recap' ) ).toBeInTheDocument();
		expect( screen.getByRole( 'heading', { level: 1, name: 'Launch recap' } ) ).toBeInTheDocument();
		expect( screen.getByText( 'Video widgets' ) ).toBeInTheDocument();
	} );
} );
