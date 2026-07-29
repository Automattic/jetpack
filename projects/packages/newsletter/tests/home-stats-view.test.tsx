// The Newsletter Mode Dashboard has two faces: the onboarding view it opens on,
// and the stats view it is meant to become once a newsletter has an audience.
//
// The 3+ subscriber rule that should decide between them is not wired yet, so
// the switch is manual. Two ways in, and both matter:
//
// 1. `?view=stats` / `?view=onboarding` on the URL. This is the reliable one —
//    Chrome and Firefox on macOS bind Cmd+J to their own Downloads window and a
//    page cannot take a browser shortcut back, so the shortcut may never fire.
//    It also makes either state a shareable link.
// 2. The Cmd+J shortcut, which flips between them.
//
// The URL wins over the remembered choice, and the choice is remembered across
// loads so that clicking into Settings and back does not reset a review.
//
// Everything the stats view shows is a placeholder — the assertions below pin
// the mockup's figures, which is what makes them worth having: they will fail
// loudly when real data is wired in, which is exactly when they should be
// rewritten.

const mockGetNewsletterScriptData = jest.fn< Record< string, unknown > | undefined, [] >();
const mockConnection = jest.fn< Record< string, unknown >, [] >();
const mockLineChartProps = jest.fn();
const mockUseKeyboardShortcut = jest.fn();

jest.mock( '@automattic/jetpack-script-data', () => ( {
	getSiteData: () => ( {
		rest_root: 'https://example.com/wp-json/',
		rest_nonce: 'test-nonce',
	} ),
	getAdminUrl: ( path: string ) => `https://example.com/wp-admin/${ path }`,
	isSimpleSite: () => true,
} ) );

jest.mock( '@automattic/jetpack-connection/use-connection', () => ( {
	__esModule: true,
	default: () => mockConnection(),
} ) );

jest.mock( '@wordpress/api-fetch', () => ( {
	__esModule: true,
	default: () => Promise.resolve( {} ),
} ) );

jest.mock( '../src/settings/script-data', () => ( {
	getNewsletterModeScriptData: () => mockGetNewsletterScriptData(),
} ) );

jest.mock( '@automattic/jetpack-components/admin-page', () => ( {
	__esModule: true,
	default: ( { children } ) => <div data-testid="admin-page">{ children }</div>,
} ) );

jest.mock( '../_inc/share/share-newsletter-modal', () => ( {
	__esModule: true,
	default: () => <div data-testid="share-modal" />,
} ) );

// The real chart pulls visx and renders a live SVG — slow to mount and brittle
// to assert against. Record the props instead, which is what we actually care
// about: the series handed to it.
jest.mock( '@automattic/charts', () => ( {
	__esModule: true,
	LineChart: ( props: Record< string, unknown > ) => {
		mockLineChartProps( props );
		return <div data-testid="line-chart" />;
	},
} ) );

jest.mock( '@automattic/charts/style.css', () => ( {} ), { virtual: true } );

// Capture the shortcut registration rather than driving Mousetrap through jsdom:
// what matters is that the right chord is bound and that firing it toggles.
jest.mock( '@wordpress/compose', () => ( {
	...jest.requireActual( '@wordpress/compose' ),
	useKeyboardShortcut: ( shortcut: string, callback: ( event: Event ) => void ) => {
		mockUseKeyboardShortcut( shortcut, callback );
	},
} ) );

import { act, render, screen, within } from '@testing-library/react';
import { stage as Stage } from '../routes/home/stage';

const NEWSLETTER_HOME = '/wp-admin/admin.php?page=jetpack-newsletter-home';

const SCRIPT_DATA = {
	greetingName: 'Zara',
	writeUrl: 'https://example.com/wp-admin/post-new.php',
	siteUrl: 'https://octagonal.example.com',
	settingsUrl: 'https://example.com/wp-admin/admin.php?page=jetpack-newsletter',
	monetizeUrl: 'https://wordpress.com/earn/octagonal.example.com',
	checklistCompleted: [],
};

/**
 * Point the address at the Dashboard, optionally asking for a view.
 *
 * @param view - Value for the `view` param, if any.
 */
function visitDashboard( view?: string ): void {
	window.history.replaceState(
		{},
		'',
		view ? `${ NEWSLETTER_HOME }&view=${ view }` : NEWSLETTER_HOME
	);
}

/** Fire the registered keyboard shortcut. */
function pressShortcut(): void {
	const [ , callback ] = mockUseKeyboardShortcut.mock.calls.at( -1 ) ?? [];

	act( () => callback( { preventDefault: jest.fn() } as unknown as Event ) );
}

const isOnboarding = () => screen.queryByText( 'Reach your first 3 readers' ) !== null;
const isStats = () => screen.queryByText( 'Recent Posts' ) !== null;

beforeEach( () => {
	mockGetNewsletterScriptData.mockReset();
	mockGetNewsletterScriptData.mockReturnValue( SCRIPT_DATA );
	mockConnection.mockReset();
	mockConnection.mockReturnValue( {
		isRegistered: true,
		hasConnectedOwner: true,
		isUserConnected: true,
	} );
	mockLineChartProps.mockReset();
	mockUseKeyboardShortcut.mockReset();
	window.localStorage.clear();
	visitDashboard();
} );

afterEach( () => {
	window.history.replaceState( {}, '', NEWSLETTER_HOME );
} );

describe( 'Newsletter Mode Dashboard view switching', () => {
	it( 'opens on the onboarding view', () => {
		render( <Stage /> );

		expect( isOnboarding() ).toBe( true );
		expect( isStats() ).toBe( false );
	} );

	it( 'opens on the stats view when the address asks for it', () => {
		visitDashboard( 'stats' );

		render( <Stage /> );

		expect( isStats() ).toBe( true );
		expect( isOnboarding() ).toBe( false );
	} );

	it( 'binds the toggle to Cmd/Ctrl+J', () => {
		render( <Stage /> );

		expect( mockUseKeyboardShortcut ).toHaveBeenCalledWith( 'mod+j', expect.any( Function ) );
	} );

	it( 'flips between the two views when the shortcut fires', () => {
		render( <Stage /> );
		expect( isOnboarding() ).toBe( true );

		pressShortcut();
		expect( isStats() ).toBe( true );

		pressShortcut();
		expect( isOnboarding() ).toBe( true );
	} );

	it( 'remembers the choice across a reload', () => {
		const { unmount } = render( <Stage /> );

		pressShortcut();
		expect( isStats() ).toBe( true );

		unmount();
		render( <Stage /> );

		expect( isStats() ).toBe( true );
	} );

	it( 'lets the address override what was remembered', () => {
		const { unmount } = render( <Stage /> );

		pressShortcut();
		unmount();

		// Remembered as stats, but the address asks for onboarding.
		visitDashboard( 'onboarding' );
		render( <Stage /> );

		expect( isOnboarding() ).toBe( true );
	} );

	it( 'ignores a view name it does not recognise', () => {
		visitDashboard( 'something-else' );

		render( <Stage /> );

		expect( isOnboarding() ).toBe( true );
	} );
} );

describe( 'Newsletter Mode Dashboard stats view', () => {
	beforeEach( () => {
		visitDashboard( 'stats' );
	} );

	it( 'shows the four headline figures', () => {
		render( <Stage /> );

		// Scoped to the bar: 122 is also a recipient count in the table below.
		const bar = within( screen.getByRole( 'group', { name: 'Newsletter performance' } ) );

		expect( bar.getByText( 'Total subscribers' ) ).toBeInTheDocument();
		expect( bar.getByText( '122' ) ).toBeInTheDocument();
		expect( bar.getByText( 'Open rate' ) ).toBeInTheDocument();
		expect( bar.getByText( '62%' ) ).toBeInTheDocument();
		expect( bar.getByText( 'Click rate' ) ).toBeInTheDocument();
		expect( bar.getByText( '14%' ) ).toBeInTheDocument();
		expect( bar.getByText( 'CTOR' ) ).toBeInTheDocument();
		expect( bar.getByText( '23%' ) ).toBeInTheDocument();
	} );

	it( 'explains CTOR, which the label alone does not', () => {
		render( <Stage /> );

		expect( screen.getByLabelText( /Click-to-open rate/ ) ).toBeInTheDocument();
	} );

	it( 'greets the same way the onboarding view does', () => {
		render( <Stage /> );

		expect( screen.getByRole( 'heading', { level: 1 } ) ).toHaveTextContent( 'Welcome, Zara' );
	} );

	it( 'draws the subscribers series with a gradient fill', () => {
		render( <Stage /> );

		expect( mockLineChartProps ).toHaveBeenCalledWith(
			expect.objectContaining( { withGradientFill: true } )
		);
	} );

	it( 'redraws the series when the cadence changes', () => {
		render( <Stage /> );

		const pointsFor = () => {
			const props = mockLineChartProps.mock.calls.at( -1 )?.[ 0 ];
			return props.data[ 0 ].data.length;
		};

		// 30 daily points is the default; weeks covers more ground in fewer.
		expect( pointsFor() ).toBe( 30 );

		const weeks = screen.getByRole( 'button', { name: 'Weeks' } );
		act( () => weeks.click() );

		expect( pointsFor() ).toBe( 26 );
	} );

	it( 'leaves the period arrows inert, since there is no history to page through', () => {
		render( <Stage /> );

		// `@wordpress/ui` keeps disabled buttons focusable and marks them with
		// `aria-disabled` rather than the native attribute, so assert on that.
		expect( screen.getByRole( 'button', { name: 'Previous period' } ) ).toHaveAttribute(
			'aria-disabled',
			'true'
		);
		expect( screen.getByRole( 'button', { name: 'Next period' } ) ).toHaveAttribute(
			'aria-disabled',
			'true'
		);
	} );

	it( 'lists the recent posts with their send figures', () => {
		render( <Stage /> );

		const table = within( screen.getByRole( 'table' ) );

		expect( table.getByText( 'Parasite' ) ).toBeInTheDocument();
		expect( table.getByText( 'Interstellar' ) ).toBeInTheDocument();
		expect( table.getByText( '122' ) ).toBeInTheDocument();
		expect( table.getByText( '58%' ) ).toBeInTheDocument();
	} );

	it( 'strips the data-grid chrome off the posts table', () => {
		render( <Stage /> );

		// A fixed five-row preview has nothing for these to act on, so the table
		// is composed down to just the layout.
		expect( screen.queryByRole( 'button', { name: 'View options' } ) ).not.toBeInTheDocument();
		expect( screen.queryByRole( 'searchbox' ) ).not.toBeInTheDocument();
		expect( screen.queryByRole( 'button', { name: /Next page/ } ) ).not.toBeInTheDocument();
	} );

	it( 'shows a draft as unsent rather than as zeroes', () => {
		render( <Stage /> );

		expect( screen.getByText( 'The Green Knight' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Draft' ) ).toBeInTheDocument();
		// Recipients, open rate and click rate are all empty for an unsent post —
		// an em dash, not a misleading 0.
		expect( screen.getAllByText( '—' ).length ).toBeGreaterThanOrEqual( 3 );
	} );
} );
