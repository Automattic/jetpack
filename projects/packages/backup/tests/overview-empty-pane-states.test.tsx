// With no row selected, the right pane must follow the activity log's state.

const mockApiFetch = jest.fn();

jest.mock( '@wordpress/api-fetch', () => ( {
	__esModule: true,
	default: ( ...args: unknown[] ) => mockApiFetch( ...args ),
} ) );

jest.mock( '@wordpress/route', () => ( {
	useSearch: () => ( {} ),
	useNavigate: () => jest.fn(),
	useParams: () => ( {} ),
	Link: ( { children, to }: { children: React.ReactNode; to: string } ) => (
		<a href={ to }>{ children }</a>
	),
} ) );

// Imports must come after the jest.mock factories above.
import { render, screen } from '@testing-library/react';
import { stage as OverviewStage } from '../routes/dashboard/stage';
import { queryClient } from '../src/dashboard/data/query-client';
import { resetListStateForTesting } from '../src/dashboard/screens/overview';

const PROMPT = 'Select an item from the list to see details.';
const LOADING = 'Loading item details…';

type Activity = 'pending' | 'error' | 'post-only';

/**
 * Answer every Overview route; the log is a post only, so no backup is auto-selected.
 *
 * @param activity - How the activity log answers.
 */
function mockEndpoints( activity: Activity ) {
	mockApiFetch.mockImplementation( ( o: { path?: string } ) => {
		const path = o?.path ?? '';
		if ( path.includes( '/site/capabilities' ) ) {
			return Promise.resolve( { hasBackupPlan: true, hasScan: false } );
		}
		if ( path.includes( '/site/rewindable-activity' ) ) {
			if ( activity === 'pending' ) {
				return new Promise( () => {} );
			}
			if ( activity === 'error' ) {
				return Promise.reject( { code: 'activity_log_fetch_failed', message: 'Unavailable' } );
			}
			return Promise.resolve( {
				current: {
					orderedItems: [
						{
							activity_id: 'act-post-1',
							gridicon: 'posts',
							summary: 'Post published',
							published: '2026-08-13T18:10:00+00:00',
							actor: { type: 'Person', name: 'Bob' },
							content: { text: 'Hello' },
							name: 'post__published',
						},
					],
				},
				totalItems: 1,
				totalPages: 1,
			} );
		}
		if ( path === '/jetpack/v4/backups' ) {
			return Promise.resolve( [
				{
					id: '1',
					started: '2026-08-13 18:08:56',
					last_updated: '2026-08-13 18:54:14',
					status: 'finished',
					period: '1786644531',
					percent: '100',
					is_backup: '1',
					is_scan: '0',
					discarded: '0',
					stats: { prefix: 'wp_' },
				},
			] );
		}
		return Promise.resolve( {} );
	} );
}

beforeEach( () => {
	resetListStateForTesting();
	queryClient.clear();
	queryClient.setDefaultOptions( { queries: { retry: false } } );
	mockApiFetch.mockReset();
	window.JP_CONNECTION_INITIAL_STATE = {
		...window.JP_CONNECTION_INITIAL_STATE,
		connectionStatus: { isRegistered: true, hasConnectedOwner: true, isUserConnected: true },
	} as typeof window.JP_CONNECTION_INITIAL_STATE;
} );

describe( 'The right pane with nothing selected', () => {
	it( 'shows a loading placeholder, not the prompt, while the list loads', async () => {
		mockEndpoints( 'pending' );
		render( <OverviewStage /> );

		await expect( screen.findByText( LOADING ) ).resolves.toBeInTheDocument();
		expect( screen.queryByText( PROMPT ) ).not.toBeInTheDocument();
	} );

	it( 'shows nothing, not the prompt, when the list failed', async () => {
		mockEndpoints( 'error' );
		render( <OverviewStage /> );

		// The list's own error is the positive: it proves the failure was reached.
		await expect(
			screen.findByText( "We couldn't load your site's activity." )
		).resolves.toBeInTheDocument();
		expect( screen.queryByText( PROMPT ) ).not.toBeInTheDocument();
		expect( screen.queryByText( LOADING ) ).not.toBeInTheDocument();
	} );

	it( 'keeps the prompt once the list loaded with no backup to select', async () => {
		mockEndpoints( 'post-only' );
		render( <OverviewStage /> );

		await expect( screen.findByText( PROMPT ) ).resolves.toBeInTheDocument();
	} );
} );
