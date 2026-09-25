import { render, screen } from '@testing-library/react';
import QueryClientWrapper from '../index';
import type { ReactNode } from 'react';

const mockObserve = jest.fn();
jest.mock( '../../../hooks/use-first-run-state', () => ( {
	useObserveFirstRunSignals: () => mockObserve(),
} ) );

// Carries its own Tracks side effects and a window latch; not what this is about.
jest.mock( '../../../hooks/use-dashboard-analytics', () => ( {
	useDashboardAnalytics: jest.fn(),
} ) );

// Stands in for a connected site. The gate is the reason the observer is a child
// component rather than a hook call in the wrapper's own body, so it stays in
// the tree — see the closed case below.
let mockIsConnected = true;
jest.mock( '../../connection-gate', () => ( {
	__esModule: true,
	default: ( { children }: { children: ReactNode } ) =>
		mockIsConnected ? <>{ children }</> : <div>{ 'connect first' }</div>,
} ) );

describe( 'QueryClientWrapper', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		mockIsConnected = true;
	} );

	// The whole point of putting it here: every route stage renders this wrapper
	// and nothing further in is common to all of them, so this is the only mount
	// point that catches the routes with no dashboard chrome — /video/:id and the
	// video editor. While the first-run flags were written from that chrome, a
	// returning user who arrived on a video link was remembered as nobody.
	it( 'observes the first-run signals for every route it wraps', () => {
		render( <QueryClientWrapper>{ 'stage' }</QueryClientWrapper> );

		expect( screen.getByText( 'stage' ) ).toBeInTheDocument();
		expect( mockObserve ).toHaveBeenCalled();
	} );

	// An unconnected site has no library to count and every request would fail,
	// so the observation belongs inside the gate, with the dashboard it describes.
	it( 'observes nothing behind a closed connection gate', () => {
		mockIsConnected = false;

		render( <QueryClientWrapper>{ 'stage' }</QueryClientWrapper> );

		expect( screen.getByText( 'connect first' ) ).toBeInTheDocument();
		expect( mockObserve ).not.toHaveBeenCalled();
	} );
} );
