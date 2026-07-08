/**
 * External dependencies
 */
import { queryClient } from '@jetpack-premium-analytics/data';
import { render, screen, waitFor } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
/**
 * Internal dependencies
 */
import SiteOverviewWidget from '../render';

jest.mock( '@wordpress/api-fetch', () => jest.fn() );

// WidgetRoot reads URL search params as a fallback for report params; outside
// a matched route the real hook warns and throws.
jest.mock( '@wordpress/route', () => ( {
	useSearch: () => ( {} ),
} ) );

const mockApiFetch = apiFetch as unknown as jest.Mock;

const SUMMARY_RESPONSE = {
	date: '2026-03-10',
	period: 'day',
	views: 420,
	visitors: 260,
	likes: 48,
	reblogs: 3,
	comments: 17,
	followers: 512,
};

const COMPARISON_RESPONSE = {
	date: '2026-02-10',
	period: 'day',
	views: 300,
	visitors: 200,
	likes: 60,
	reblogs: 2,
	comments: 12,
	followers: 480,
};

describe( 'SiteOverviewWidget', () => {
	beforeEach( () => {
		// The data package's query client is a module-level singleton; drop its
		// cache so each test starts from a fresh fetch.
		queryClient.clear();
		mockApiFetch.mockReset();
		mockApiFetch.mockResolvedValue( SUMMARY_RESPONSE );
	} );

	it( 'renders the period metrics from the summary response', async () => {
		render(
			<SiteOverviewWidget
				attributes={ { reportParams: { from: '2026-03-01', to: '2026-03-10' } } }
			/>
		);

		await expect( screen.findByText( '420' ) ).resolves.toBeInTheDocument();
		expect( screen.getByText( 'Views' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Visitors' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Likes' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Comments' ) ).toBeInTheDocument();
		expect( screen.getByText( '260' ) ).toBeInTheDocument();
		expect( screen.getByText( '17' ) ).toBeInTheDocument();
	} );

	it( 'requests the dashboard date range from report params', async () => {
		render(
			<SiteOverviewWidget
				attributes={ { reportParams: { from: '2026-03-01', to: '2026-03-10' } } }
			/>
		);

		await expect( screen.findByText( '420' ) ).resolves.toBeInTheDocument();

		const requestedPath = mockApiFetch.mock.calls[ 0 ][ 0 ].path as string;
		expect( requestedPath ).toContain( 'stats/summary' );
		expect( requestedPath ).toContain( 'date=2026-03-10' );
	} );

	it( 'fetches the comparison window when comparison params are present', async () => {
		mockApiFetch.mockImplementation( ( { path }: { path: string } ) =>
			Promise.resolve( path.includes( 'date=2026-02-10' ) ? COMPARISON_RESPONSE : SUMMARY_RESPONSE )
		);

		render(
			<SiteOverviewWidget
				attributes={ {
					reportParams: {
						from: '2026-03-01',
						to: '2026-03-10',
						comp: '1',
						compare_from: '2026-02-01',
						compare_to: '2026-02-10',
					},
				} }
			/>
		);

		await expect( screen.findByText( '420' ) ).resolves.toBeInTheDocument();

		const requestedPaths = mockApiFetch.mock.calls.map( call => call[ 0 ].path as string );
		expect( requestedPaths.some( path => path.includes( 'date=2026-03-10' ) ) ).toBe( true );
		expect( requestedPaths.some( path => path.includes( 'date=2026-02-10' ) ) ).toBe( true );
	} );

	it( 'keeps the stale tiles and overlays a spinner while a new date range loads', async () => {
		// Hold the second period's fetch open so the refetch state is observable.
		let resolveNextPeriod: ( () => void ) | undefined;
		mockApiFetch.mockImplementation( ( { path }: { path: string } ) => {
			if ( path.includes( 'date=2026-03-10' ) ) {
				return Promise.resolve( SUMMARY_RESPONSE );
			}
			return new Promise( resolve => {
				resolveNextPeriod = () => resolve( { ...SUMMARY_RESPONSE, views: 999 } );
			} );
		} );

		const { container, rerender } = render(
			<SiteOverviewWidget
				attributes={ { reportParams: { from: '2026-03-01', to: '2026-03-10' } } }
			/>
		);

		await expect( screen.findByText( '420' ) ).resolves.toBeInTheDocument();

		// The overlay's spinner is decorative (`role="presentation"`), so there is
		// no accessible role/text to query — assert on its stable class instead.
		const hasOverlaySpinner = () =>
			// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access -- decorative spinner, no accessible query target
			container.querySelector( '.components-spinner' ) !== null;

		// Switch the date range: the new fetch is in flight but not yet resolved.
		rerender(
			<SiteOverviewWidget
				attributes={ { reportParams: { from: '2026-04-01', to: '2026-04-10' } } }
			/>
		);

		// The previous period's tiles stay put rather than blanking to a spinner…
		expect( screen.getByText( '420' ) ).toBeInTheDocument();
		// …and the refetch overlay spinner is layered on top.
		await waitFor( () => expect( hasOverlaySpinner() ).toBe( true ) );

		// Once the new period resolves, its totals replace the stale ones and the
		// overlay clears.
		resolveNextPeriod?.();
		await expect( screen.findByText( '999' ) ).resolves.toBeInTheDocument();
		expect( hasOverlaySpinner() ).toBe( false );
	} );
} );
