// The Newsletter dashboard route stage owns the `jetpack_newsletter_tab_view`
// Tracks event. Two contracts matter:
//
// 1. The event fires once on initial mount carrying the landing tab (so a
//    visitor who deep-links to `?tab=settings` is counted as a Settings view),
//    and once per subsequent active-tab change.
// 2. React 18 StrictMode's dev-only mount/cleanup/remount cycle MUST NOT
//    produce a duplicate fire. The implementation guards this with a `useRef`
//    keyed on the last tracked tab — refs persist across the simulated
//    remount, so the second `useEffect` setup finds the active tab already
//    recorded and bails out.

const mockRecordEvent = jest.fn();
const mockInitialize = jest.fn();
const mockSearch = jest.fn< { tab?: string }, [] >();
const mockIsSimpleSite = jest.fn< boolean, [] >();
const mockConnection = jest.fn< Record< string, unknown >, [] >();

jest.mock( '@automattic/jetpack-analytics', () => ( {
	__esModule: true,
	default: {
		initialize: ( ...args: unknown[] ) => mockInitialize( ...args ),
		tracks: { recordEvent: ( ...args: unknown[] ) => mockRecordEvent( ...args ) },
	},
} ) );

jest.mock( '@automattic/jetpack-script-data', () => ( {
	getSiteData: () => ( { admin_url: 'https://example.com/wp-admin/' } ),
	getSiteType: () => 'jetpack',
	isSimpleSite: () => mockIsSimpleSite(),
} ) );

jest.mock( '@automattic/jetpack-connection/use-connection', () => ( {
	__esModule: true,
	default: () => mockConnection(),
} ) );

jest.mock( '@wordpress/route', () => ( {
	useSearch: () => mockSearch(),
} ) );

// QueryClientProvider has no behavior relevant to this test; render children
// directly so we don't have to spin up a real `QueryClient`.
jest.mock( '@tanstack/react-query', () => ( {
	QueryClientProvider: ( { children }: { children: React.ReactNode } ) => <>{ children }</>,
} ) );

jest.mock( '@wordpress/ui', () => ( {
	Tabs: {
		Panel: ( { children }: { children: React.ReactNode } ) => <>{ children }</>,
	},
} ) );

// SubscribersBody is a render-prop component; the Stage passes a function
// that builds the panels. The mock invokes it with empty slot data so the
// downstream render path is exercised without any data-views machinery.
jest.mock( '../_inc/subscribers/components/subscribers-body', () => ( {
	__esModule: true,
	default: ( {
		children,
	}: {
		children: ( ctx: { body: React.ReactNode; actions: React.ReactNode } ) => React.ReactNode;
	} ) => <>{ children( { body: <div data-testid="subscribers-body" />, actions: null } ) }</>,
} ) );

jest.mock( '../_inc/subscribers/components/connection-gate', () => ( {
	__esModule: true,
	default: () => <div data-testid="connection-gate" />,
} ) );

jest.mock( '../_inc/subscribers/lib/query-client', () => ( {
	queryClient: {},
} ) );

jest.mock( '../src/settings/newsletter-settings', () => ( {
	NewsletterSettingsBody: () => null,
} ) );

jest.mock( '../src/settings/script-data', () => ( {
	getNewsletterScriptData: () => ( {
		subscriberManagementEnabled: true,
		tracksUserData: { userid: 1, username: 'tester' },
	} ),
} ) );

// NewsletterPage's render output is irrelevant for the analytics contract;
// reduce it to a children passthrough so the test doesn't depend on the
// shell's tab nav, AdminPage wiring, or SCSS imports.
jest.mock( '../_inc/components/newsletter-page', () => ( {
	__esModule: true,
	default: ( { children }: { children: React.ReactNode } ) => <>{ children }</>,
} ) );

// SCSS side-effect imports — no-op in jest.
jest.mock( '../src/settings/style.scss', () => ( {} ), { virtual: true } );
jest.mock( '../routes/dashboard/route.scss', () => ( {} ), { virtual: true } );

// Imports must come after the jest.mock factories above.
import { render, screen } from '@testing-library/react';
import { StrictMode } from 'react';
import { stage as Stage } from '../routes/dashboard/stage';

beforeEach( () => {
	mockRecordEvent.mockReset();
	mockInitialize.mockReset();
	mockSearch.mockReset();
	mockSearch.mockReturnValue( {} );
	mockIsSimpleSite.mockReset();
	mockIsSimpleSite.mockReturnValue( false );
	mockConnection.mockReset();
	mockConnection.mockReturnValue( {
		isRegistered: false,
		hasConnectedOwner: false,
		isUserConnected: false,
		siteIsRegistering: false,
		userIsConnecting: false,
		handleRegisterSite: jest.fn(),
	} );
} );

describe( 'Newsletter dashboard Stage analytics', () => {
	it( 'records jetpack_newsletter_tab_view once on initial mount with the landing tab', () => {
		render( <Stage /> );

		expect( mockRecordEvent ).toHaveBeenCalledTimes( 1 );
		expect( mockRecordEvent ).toHaveBeenCalledWith( 'jetpack_newsletter_tab_view', {
			site_type: 'jetpack',
			tab: 'subscribers',
		} );
	} );

	it( 'records the Settings tab when the route deep-links to ?tab=settings', () => {
		mockSearch.mockReturnValue( { tab: 'settings' } );

		render( <Stage /> );

		expect( mockRecordEvent ).toHaveBeenCalledTimes( 1 );
		expect( mockRecordEvent ).toHaveBeenCalledWith( 'jetpack_newsletter_tab_view', {
			site_type: 'jetpack',
			tab: 'settings',
		} );
	} );

	it( 'records again with the new tab when the active tab flips', () => {
		const { rerender } = render( <Stage /> );
		expect( mockRecordEvent ).toHaveBeenCalledTimes( 1 );

		// Simulate the route flipping `?tab=settings`; useSearch's next return
		// drives the activeTab dep and re-runs the tab-view effect.
		mockSearch.mockReturnValue( { tab: 'settings' } );
		rerender( <Stage /> );

		expect( mockRecordEvent ).toHaveBeenCalledTimes( 2 );
		expect( mockRecordEvent ).toHaveBeenLastCalledWith( 'jetpack_newsletter_tab_view', {
			site_type: 'jetpack',
			tab: 'settings',
		} );
	} );

	it( 'does not re-fire when re-rendered with the same active tab', () => {
		const { rerender } = render( <Stage /> );
		expect( mockRecordEvent ).toHaveBeenCalledTimes( 1 );

		// Re-render without touching mockSearch — activeTab stays 'subscribers'.
		rerender( <Stage /> );

		expect( mockRecordEvent ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'dedupes React 18 StrictMode mount/cleanup/remount so only one event fires', () => {
		render(
			<StrictMode>
				<Stage />
			</StrictMode>
		);

		// Without the `useRef` dedupe, StrictMode dev-mode would run the
		// useEffect setup twice on mount and we'd see 2 calls here.
		expect( mockRecordEvent ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'initializes analytics once on mount with the tracks user data', () => {
		render( <Stage /> );

		expect( mockInitialize ).toHaveBeenCalledTimes( 1 );
		expect( mockInitialize ).toHaveBeenCalledWith( 1, 'tester' );
	} );
} );

describe( 'Newsletter dashboard Stage connection gate', () => {
	it( 'shows the connection gate on a disconnected non-Simple site', () => {
		render( <Stage /> );

		expect( screen.getByTestId( 'connection-gate' ) ).toBeInTheDocument();
		expect( screen.queryByTestId( 'subscribers-body' ) ).not.toBeInTheDocument();
	} );

	it( 'bypasses the gate on a Simple site even without a Jetpack connection', () => {
		// Simple sites are hosted on WP.com and never carry a Jetpack
		// connection; the subscriber endpoints resolve directly to WP.com.
		mockIsSimpleSite.mockReturnValue( true );

		render( <Stage /> );

		expect( screen.getByTestId( 'subscribers-body' ) ).toBeInTheDocument();
		expect( screen.queryByTestId( 'connection-gate' ) ).not.toBeInTheDocument();
	} );

	it( 'shows the subscribers body on a fully connected non-Simple site', () => {
		mockConnection.mockReturnValue( {
			isRegistered: true,
			hasConnectedOwner: true,
			isUserConnected: true,
			siteIsRegistering: false,
			userIsConnecting: false,
			handleRegisterSite: jest.fn(),
		} );

		render( <Stage /> );

		expect( screen.getByTestId( 'subscribers-body' ) ).toBeInTheDocument();
		expect( screen.queryByTestId( 'connection-gate' ) ).not.toBeInTheDocument();
	} );
} );
