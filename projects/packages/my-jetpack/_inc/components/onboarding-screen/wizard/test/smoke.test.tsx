import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { bell, chartBar, border, drafts, published } from '@wordpress/icons';
import { Children, isValidElement } from 'react';
import { startBenefits } from '../lib';
import { PANEL_LINES } from '../panel-type';
import { Wizard } from '../wizard';
import type { UserEvent } from '@testing-library/user-event';
import type { ReactElement, ReactNode } from 'react';

/*
 * The slice of `useConnection` the wizard reads. Held in a mutable object rather
 * than re-mocked per test, because the hook hands the same object back on every
 * render: a test moves it and re-renders, the way the store would.
 */
const mockConnection: {
	handleRegisterSite: jest.Mock< Promise< unknown >, [] >;
	siteIsRegistering: boolean;
	userIsConnecting: boolean;
	isUserConnected: boolean;
	registrationError: Record< string, unknown > | false;
} = {
	handleRegisterSite: jest.fn(),
	siteIsRegistering: false,
	userIsConnecting: false,
	isUserConnected: false,
	registrationError: false,
};

const mockUseConnection = jest.fn( () => mockConnection );

jest.mock( '@automattic/jetpack-connection', () => ( {
	__esModule: true,
	useConnection: ( ...args: unknown[] ) => mockUseConnection( ...( args as [] ) ),
} ) );

// Defaults to false: only the arrival test turns it on.
const mockJustConnected = jest.fn( () => false );

jest.mock( '../use-just-connected', () => ( {
	__esModule: true,
	useJustConnected: () => mockJustConnected(),
	markConnecting: jest.fn(),
} ) );

const mockRecordEvent = jest.fn();

jest.mock( '../../../../hooks/use-analytics', () => ( {
	__esModule: true,
	default: () => ( { recordEvent: mockRecordEvent } ),
} ) );

/*
 * The six modules the feature step offers. Mocked here rather than driven through
 * the modules store: these tests are about the shell and the way through it, and
 * the hook has its own tests for what it does with the store.
 */
const mockModules = [
	{
		slug: 'stats',
		name: 'Jetpack Stats',
		description: 'Traffic insights.',
		icon: chartBar,
		activated: true,
	},
	{
		slug: 'monitor',
		name: 'Downtime Monitor',
		description: 'Alerts if it goes down.',
		icon: bell,
		activated: false,
	},
];

const mockApply = jest.fn( ( modules: typeof mockModules, wanted: Record< string, boolean > ) =>
	Promise.resolve(
		modules.map( module => ( {
			slug: module.slug,
			name: module.name,
			wanted: wanted[ module.slug ] ?? true,
			ok: true,
		} ) )
	)
);

jest.mock( '../use-setup-modules', () => ( {
	__esModule: true,
	useSetupModules: () => ( { modules: mockModules, isLoading: false } ),
	useApplySetupModules: () => ( { apply: mockApply, isApplying: false } ),
} ) );

const mockApiFetch = jest.fn( () => Promise.resolve( {} ) );

jest.mock( '@wordpress/api-fetch', () => ( {
	__esModule: true,
	default: ( ...args: unknown[] ) => mockApiFetch( ...( args as [] ) ),
} ) );

const exitUrl = 'http://example.com/wp-admin/admin.php?page=my-jetpack';
const dashboardUrl = 'http://example.com/wp-admin/';

// Where the wizard sent the browser, which is the only thing jsdom lets us see.
const mockAssignLocation = jest.fn();

jest.mock( '../assign-location', () => ( {
	__esModule: true,
	assignLocation: ( url: string ) => mockAssignLocation( url ),
} ) );

const assignedHref = () => mockAssignLocation.mock.calls.at( -1 )?.[ 0 ] ?? null;

beforeEach( () => {
	mockAssignLocation.mockClear();
	mockApiFetch.mockClear();
	mockApiFetch.mockResolvedValue( {} );
	mockRecordEvent.mockClear();
	mockUseConnection.mockClear();
	mockConnection.handleRegisterSite.mockReset();
	mockConnection.handleRegisterSite.mockResolvedValue( undefined );
	mockConnection.siteIsRegistering = false;
	mockConnection.userIsConnecting = false;
	mockConnection.isUserConnected = false;
	mockConnection.registrationError = false;
	mockJustConnected.mockReturnValue( false );
} );

/**
 * Render the wizard.
 *
 * @param options                 - How the wizard is opened.
 * @param options.isUserConnected - Whether the user has already been to WordPress.com.
 * @return The user-event instance and a re-render that keeps the same props.
 */
const setupWizard = ( { isUserConnected = false } = {} ) => {
	mockConnection.isUserConnected = isUserConnected;

	const user = userEvent.setup();
	const { rerender } = render( <Wizard exitUrl={ exitUrl } dashboardUrl={ dashboardUrl } /> );

	return {
		user,
		// Re-renders with the same props, so a move in the connection mock reaches
		// the component the way a store update would.
		refresh: () => rerender( <Wizard exitUrl={ exitUrl } dashboardUrl={ dashboardUrl } /> ),
	};
};

const getStarted = () => screen.getByRole( 'button', { name: 'Get started' } );

const heading = () => screen.getByRole( 'heading', { level: 1 } );

// A rail row, found by its label rather than by position.
const railStep = ( name: string ) =>
	within( screen.getByRole( 'navigation', { name: 'Setup steps' } ) ).getByRole( 'button', {
		name,
	} );

// The first path of an icon from `@wordpress/icons`, read off the package rather
// than copied into the test, so the two cannot drift apart. It is enough to tell
// the three status glyphs apart: `published` leads with its ring, `drafts` with
// its half fill, and `border` has only its dashed ring.
const firstPath = ( icon: ReactElement ): string => {
	// Not a DOM node: this is the React element the icon module exports, read
	// before it is ever rendered.
	// eslint-disable-next-line testing-library/no-node-access
	const [ first ] = Children.toArray( ( icon.props as { children?: ReactNode } ).children );
	return isValidElement( first ) ? ( first.props as { d: string } ).d : '';
};

const GLYPH_BY_PATH: Record< string, string > = {
	[ firstPath( published ) ]: 'done',
	[ firstPath( drafts ) ]: 'current',
	[ firstPath( border ) ]: 'upcoming',
};

// Which status glyph a rail row is showing: 'done', 'current', or 'upcoming'.
// The glyph is aria-hidden, as a decorative status marker should be, so there
// is no accessible query for it and the path has to be read off the SVG.
const railGlyph = ( name: string ) =>
	// eslint-disable-next-line testing-library/no-node-access
	GLYPH_BY_PATH[ railStep( name ).querySelector( 'svg path' )?.getAttribute( 'd' ) ?? '' ];

// The panel's lines are outlined SVG, so the words live in one visually hidden
// block per step, read as a sentence rather than as fragments.
const PANEL_COPY = Object.values( PANEL_LINES ).map( lines =>
	lines.map( line => line.text ).join( ' ' )
);

const panelCopy = ( step: number ) => screen.getByText( PANEL_COPY[ step ] );

// A question step needs a choice before Continue is live; the feature step starts
// with every row answered. The start step is not advanced this way: it leaves
// wp-admin entirely.
const advance = async ( user: UserEvent, times: number ) => {
	for ( let i = 0; i < times; i++ ) {
		const radios = screen.queryAllByRole( 'radio' );
		if ( radios.length ) {
			await user.click( radios[ 0 ] );
		}
		await user.click( screen.getByRole( 'button', { name: 'Continue' } ) );
		// Leaving the feature step switches the modules, so the next one arrives async.
		await waitFor( () => expect( screen.getByRole( 'heading', { level: 1 } ) ).toBeVisible() );
	}
};

describe( 'Wizard start screen', () => {
	it( 'opens on the start screen while nobody is connected', () => {
		setupWizard();

		expect( heading() ).toHaveTextContent( 'Start with Jetpack for free' );
		// The start screen shows no progress of its own, so only the rail counts.
		expect( screen.getByText( 'Step 1 of 4' ) ).toBeInTheDocument();
		expect( railGlyph( 'Connect' ) ).toBe( 'current' );
	} );

	it( 'leaves one control on it: the account question is not asked here', () => {
		setupWizard();

		// One control, not two: WordPress.com asks whether they already have an
		// account, so this screen does not have to.
		expect(
			screen.queryByRole( 'button', { name: 'I already have an account' } )
		).not.toBeInTheDocument();
		expect( getStarted() ).toBeInTheDocument();
	} );

	// skipPricingPage is load-bearing, not a preference: the plans page drops
	// redirect_after_auth, so without it the user never comes back here.
	it( 'asks the connection to bring the user back to the wizard', () => {
		setupWizard();

		expect( mockUseConnection ).toHaveBeenCalledWith( {
			from: 'jetpack-onboarding-wizard',
			redirectUri: 'admin.php?page=my-jetpack&step=onboarding',
			skipPricingPage: true,
		} );
	} );

	it( 'registers on its primary and hands off without advancing by itself', async () => {
		const { user } = setupWizard();

		await user.click( getStarted() );

		await waitFor( () =>
			expect( mockRecordEvent ).toHaveBeenCalledWith(
				'jetpack_myjetpack_onboarding_wizard_connect_success'
			)
		);

		expect( mockConnection.handleRegisterSite ).toHaveBeenCalledTimes( 1 );
		expect( mockRecordEvent ).toHaveBeenCalledWith(
			'jetpack_myjetpack_onboarding_wizard_connect_click'
		);
		// The browser is on its way to WordPress.com; the step does not move here.
		expect( heading() ).toHaveTextContent( 'Start with Jetpack for free' );
	} );

	it( 'disables the primary while connecting, so a second click cannot register twice', async () => {
		const { user, refresh } = setupWizard();

		// Never settles: the button has to hold the busy state on its own.
		mockConnection.handleRegisterSite.mockImplementation( () => new Promise( () => {} ) );

		await user.click( getStarted() );

		mockConnection.siteIsRegistering = true;
		refresh();

		expect( getStarted() ).toHaveAttribute( 'aria-disabled', 'true' );

		await user.click( getStarted() );

		expect( mockConnection.handleRegisterSite ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'stays busy while the browser is being sent to WordPress.com', () => {
		mockConnection.userIsConnecting = true;
		setupWizard();

		expect( getStarted() ).toHaveAttribute( 'aria-disabled', 'true' );
	} );

	it( 'holds on the start screen when it fails, and says what happened', async () => {
		const error = {
			message: 'Site is inaccessible (Status 403)',
			response: { code: 'site_inaccessible' },
			name: 'ApiError',
		};
		mockConnection.handleRegisterSite.mockRejectedValue( error );

		const { user, refresh } = setupWizard();

		await user.click( getStarted() );

		await waitFor( () =>
			expect( mockRecordEvent ).toHaveBeenCalledWith(
				'jetpack_myjetpack_onboarding_wizard_connect_error',
				{ error_code: 'site_inaccessible' }
			)
		);

		mockConnection.registrationError = error;
		refresh();

		// It does not advance, and the button comes back so they can retry.
		expect( heading() ).toHaveTextContent( 'Start with Jetpack for free' );
		expect( getStarted() ).not.toHaveAttribute( 'aria-disabled', 'true' );

		// A sentence first, the server's own words second.
		expect(
			screen.getByText( 'We could not connect this site. Please try again.' )
		).toBeInTheDocument();
		expect( screen.getByText( 'Site is inaccessible (Status 403)' ) ).toBeInTheDocument();

		// The message interpolates the server's prose; only the code is reported.
		expect( mockRecordEvent ).not.toHaveBeenCalledWith(
			'jetpack_myjetpack_onboarding_wizard_connect_error',
			expect.objectContaining( { error: expect.anything() } )
		);
		expect( mockRecordEvent ).not.toHaveBeenCalledWith(
			'jetpack_myjetpack_onboarding_wizard_connect_success'
		);
	} );

	it( 'reports a hand-off failure too, which never reaches the store', async () => {
		// Fetching the authorization URL failed, so `registrationError` stays empty.
		mockConnection.handleRegisterSite.mockRejectedValue( { message: '', name: 'JsonParseError' } );

		const { user } = setupWizard();

		await user.click( getStarted() );

		await expect(
			screen.findByText( 'We could not connect this site. Please try again.' )
		).resolves.toBeInTheDocument();
		// No message to show, so the code stands in for it.
		expect( screen.getByText( 'JsonParseError' ) ).toBeInTheDocument();
		expect( mockRecordEvent ).toHaveBeenCalledWith(
			'jetpack_myjetpack_onboarding_wizard_connect_error',
			{ error_code: 'JsonParseError' }
		);
	} );

	it( 'names what Jetpack does, one free feature group per row', () => {
		setupWizard();

		const benefits = startBenefits();

		expect( screen.getByRole( 'img', { name: 'Jetpack Logo' } ) ).toBeInTheDocument();
		expect(
			screen.getByText( 'One plugin, and your site can do the things it usually takes five to do.' )
		).toBeInTheDocument();

		expect( benefits ).toHaveLength( 4 );
		for ( const benefit of benefits ) {
			expect( screen.getByText( benefit.text ) ).toBeInTheDocument();
		}

		// Both are paid, and this screen cannot promise what sits behind a plan.
		expect( screen.queryByText( /VideoPress|Backup/ ) ).not.toBeInTheDocument();
	} );

	it( 'points the terms at the real Jetpack pages', () => {
		setupWizard();

		expect( screen.getByRole( 'link', { name: /Terms of Service/ } ) ).toHaveAttribute(
			'href',
			'https://jetpack.com/redirect/?source=wpcom-tos'
		);
		expect( screen.getByRole( 'link', { name: /sync your site’s data/ } ) ).toHaveAttribute(
			'href',
			'https://jetpack.com/redirect/?source=jetpack-support-what-data-does-jetpack-sync'
		);
	} );

	it( 'keeps the exit in the footer but not a second primary', () => {
		setupWizard();

		expect( screen.getByRole( 'link', { name: 'Skip setup' } ) ).toBeInTheDocument();
		expect( screen.queryByRole( 'button', { name: 'Continue' } ) ).not.toBeInTheDocument();
		expect( screen.queryByRole( 'button', { name: 'Back' } ) ).not.toBeInTheDocument();
	} );
} );

describe( 'Wizard resume after connecting', () => {
	it( 'opens at the site-type step once the user is connected', () => {
		setupWizard( { isUserConnected: true } );

		expect( heading() ).toHaveTextContent( "What's this site for?" );
		// The rail is the only thing that counts the steps; the question column
		// carries the question and nothing else.
		expect( screen.getAllByText( 'Step 2 of 4' ) ).toHaveLength( 1 );
		expect( screen.queryByRole( 'button', { name: 'Get started' } ) ).not.toBeInTheDocument();
	} );

	it( 'shows Connect as done, because connecting is what step one is', () => {
		setupWizard( { isUserConnected: true } );

		expect( railGlyph( 'Connect' ) ).toBe( 'done' );
		expect( railGlyph( 'Your site' ) ).toBe( 'current' );
		// The trap: a step the user has never seen must never take the tick.
		expect( railGlyph( 'What you need' ) ).toBe( 'upcoming' );
		expect( railGlyph( 'Finish' ) ).toBe( 'upcoming' );
	} );

	it( 'says the connection worked on the step it lands on', () => {
		mockJustConnected.mockReturnValue( true );

		setupWizard( { isUserConnected: true } );

		expect( screen.getByRole( 'status' ) ).toHaveTextContent( 'Connected to WordPress.com' );
	} );

	it( 'says nothing to someone who was already connected when they arrived', () => {
		setupWizard( { isUserConnected: true } );

		expect( screen.queryByRole( 'status' ) ).not.toBeInTheDocument();
	} );

	// The flag is consumed on the first read, or the arrival is announced again on
	// every step and every reload for the rest of the session.
	it( 'reads the arrival flag once and takes it away', () => {
		jest.isolateModules( () => {
			window.sessionStorage.setItem( 'jetpack-onboarding-connecting', '1' );

			// requireActual, because this file mocks the module for every other test;
			// isolateModules is synchronous, so import() cannot be awaited inside it.
			const { useJustConnected } = jest.requireActual( '../use-just-connected' );

			expect( useJustConnected() ).toBe( true );
			expect( window.sessionStorage.getItem( 'jetpack-onboarding-connecting' ) ).toBeNull();
			// Cached for the page load, so a remount does not lose the moment.
			expect( useJustConnected() ).toBe( true );
		} );
	} );

	// The floor is enforced in the click handler, so a row below it that does not
	// say so takes focus, announces as available, and then swallows the click.
	it( 'marks the rail rows it will not move to, below the floor as well as above', () => {
		setupWizard( { isUserConnected: true } );

		expect( railStep( 'Connect' ) ).toHaveAttribute( 'aria-disabled', 'true' );
		expect( railStep( 'What you need' ) ).toHaveAttribute( 'aria-disabled', 'true' );
		expect( railStep( 'Your site' ) ).not.toHaveAttribute( 'aria-disabled', 'true' );
	} );
} );

describe( 'Wizard shell', () => {
	it( 'sends the rail out to WordPress and the footer back to My Jetpack', () => {
		setupWizard();

		const railExit = screen.getByRole( 'link', { name: 'Back to WordPress' } );
		const skip = screen.getByRole( 'link', { name: 'Skip setup' } );

		expect( railExit ).toHaveAttribute( 'href', dashboardUrl );
		expect( skip ).toHaveAttribute( 'href', exitUrl );

		// Two exits, two destinations: the rail leaves Jetpack, the footer stays in it.
		expect( railExit.getAttribute( 'href' ) ).not.toBe( skip.getAttribute( 'href' ) );
	} );

	it( 'lists every step in the rail, marking the current one', () => {
		setupWizard( { isUserConnected: true } );

		const rail = screen.getByRole( 'navigation', { name: 'Setup steps' } );
		expect( within( rail ).getByRole( 'list' ) ).toBeInTheDocument();
		expect(
			within( rail )
				.getAllByRole( 'button' )
				.map( row => row.textContent )
		).toEqual( [ 'Connect', 'Your site', 'What you need', 'Finish' ] );

		// Core marks the current row aria-current="true", not "step".
		expect( railStep( 'Your site' ) ).toHaveAttribute( 'aria-current', 'true' );
		expect( railStep( 'Connect' ) ).not.toHaveAttribute( 'aria-current' );
	} );

	it( 'shows the current step half filled and every step ahead of it dashed', () => {
		setupWizard();

		expect( railGlyph( 'Connect' ) ).toBe( 'current' );
		expect( railGlyph( 'Your site' ) ).toBe( 'upcoming' );
		expect( railGlyph( 'What you need' ) ).toBe( 'upcoming' );
		expect( railGlyph( 'Finish' ) ).toBe( 'upcoming' );

		// Nothing is done before anything has been left.
		expect( [ 'Connect', 'Your site', 'What you need', 'Finish' ].map( railGlyph ) ).not.toContain(
			'done'
		);
	} );

	it( 'reads the glyphs off the current step, not off the furthest one reached', async () => {
		const { user } = setupWizard( { isUserConnected: true } );

		await advance( user, 1 );
		expect( railGlyph( 'What you need' ) ).toBe( 'current' );

		await user.click( railStep( 'Your site' ) );

		// Ground already covered stays clickable, but it is ahead of the user
		// again, so it is dashed rather than ticked.
		expect( railStep( 'What you need' ) ).not.toHaveAttribute( 'aria-disabled', 'true' );
		expect( railGlyph( 'Your site' ) ).toBe( 'current' );
		expect( railGlyph( 'What you need' ) ).toBe( 'upcoming' );
	} );

	it( 'marks unreached steps aria-disabled, never disabled, and keeps them focusable', () => {
		setupWizard();

		const unreached = railStep( 'Your site' );
		expect( unreached ).toHaveAttribute( 'aria-disabled', 'true' );
		expect( unreached ).toBeEnabled();

		unreached.focus();
		expect( unreached ).toHaveFocus();
	} );

	it( 'ignores a click on a step beyond the furthest reached', async () => {
		const { user } = setupWizard();

		await user.click( railStep( 'What you need' ) );

		expect( heading() ).toHaveTextContent( 'Start with Jetpack for free' );
	} );

	it( 'goes back to a step already reached when its rail row is clicked', async () => {
		const { user } = setupWizard( { isUserConnected: true } );

		await advance( user, 1 );
		expect( heading() ).toHaveTextContent( "Here's what we recommend for your site" );

		await user.click( railStep( 'Your site' ) );
		expect( heading() ).toHaveTextContent( "What's this site for?" );

		// Ground already covered stays reachable after stepping back.
		expect( railStep( 'What you need' ) ).not.toHaveAttribute( 'aria-disabled', 'true' );
	} );

	/*
	 * The finish step takes the whole sheet: the rail counts steps that are all
	 * behind you and the panel sells a flow you have just finished.
	 */
	it( 'drops the rail and the panel on the finish step', async () => {
		const { user } = setupWizard( { isUserConnected: true } );

		expect( screen.getByRole( 'navigation' ) ).toBeInTheDocument();

		await advance( user, 2 );

		expect( screen.queryByRole( 'navigation' ) ).not.toBeInTheDocument();
		expect( screen.queryByText( PANEL_COPY[ 3 ] ) ).not.toBeInTheDocument();
	} );

	/*
	 * Connecting is done and cannot be undone here. The connect screen's only
	 * button registers the site, so reaching it again would offer to do that twice.
	 */
	it( 'will not let a connected user back onto the connect screen', async () => {
		const { user } = setupWizard( { isUserConnected: true } );

		expect( screen.queryByRole( 'button', { name: 'Back' } ) ).not.toBeInTheDocument();

		await user.click( railStep( 'Connect' ) );
		expect( heading() ).toHaveTextContent( "What's this site for?" );

		await advance( user, 1 );
		await user.click( screen.getByRole( 'button', { name: 'Back' } ) );
		expect( heading() ).toHaveTextContent( "What's this site for?" );
		expect( screen.queryByRole( 'button', { name: 'Get started' } ) ).not.toBeInTheDocument();
	} );

	it( 'gates Continue on the question steps', async () => {
		const { user } = setupWizard( { isUserConnected: true } );

		const cont = screen.getByRole( 'button', { name: 'Continue' } );
		expect( cont ).toHaveAttribute( 'aria-disabled', 'true' );

		await user.click( screen.getAllByRole( 'radio' )[ 0 ] );
		expect( cont ).not.toHaveAttribute( 'aria-disabled', 'true' );
	} );

	it( 'marks the chosen option as checked', async () => {
		const { user } = setupWizard( { isUserConnected: true } );

		const [ first, second ] = screen.getAllByRole( 'radio' );
		expect( first ).not.toBeChecked();

		await user.click( second );
		expect( second ).toBeChecked();
		expect( first ).not.toBeChecked();
	} );

	it( 'offers Back only once a step has been left', async () => {
		const { user } = setupWizard( { isUserConnected: true } );

		await advance( user, 1 );
		await user.click( screen.getByRole( 'button', { name: 'Back' } ) );

		expect( heading() ).toHaveTextContent( "What's this site for?" );
	} );

	it( 'replaces Continue with Finish on the last step', async () => {
		const { user } = setupWizard( { isUserConnected: true } );

		await advance( user, 2 );

		// The finish step carries its own two ways out instead of the footer's.
		expect( screen.queryByRole( 'button', { name: 'Continue' } ) ).not.toBeInTheDocument();
		expect( screen.getByRole( 'link', { name: 'Back to WordPress' } ) ).toHaveAttribute(
			'href',
			dashboardUrl
		);
		expect( screen.getByRole( 'link', { name: 'Go to My Jetpack' } ) ).toHaveAttribute(
			'href',
			exitUrl
		);
	} );

	it( 'gives every step its own panel copy, and shows only the current one', async () => {
		const { user } = setupWizard( { isUserConnected: true } );

		expect( panelCopy( 1 ) ).toBeInTheDocument();
		expect( screen.queryByText( PANEL_COPY[ 0 ] ) ).not.toBeInTheDocument();

		// Stops at the feature step: the finish step has no panel to carry copy.
		for ( const step of [ 2 ] ) {
			await advance( user, 1 );
			expect( panelCopy( step ) ).toBeInTheDocument();
			expect( screen.queryByText( PANEL_COPY[ step - 1 ] ) ).not.toBeInTheDocument();
		}
	} );

	it( 'draws the lines as outlines, flipped out of y-up font coordinates', () => {
		setupWizard();

		// eslint-disable-next-line testing-library/no-node-access
		const svgs = Array.from( panelCopy( 0 ).parentElement?.querySelectorAll( 'svg' ) ?? [] );

		// One per line, and hidden: the words are carried by the copy above
		// instead. Counted off the data, because the start screen's copy is
		// three lines where every other step's is two.
		expect( svgs ).toHaveLength( PANEL_LINES[ 0 ].length );
		expect( svgs.every( svg => svg.getAttribute( 'aria-hidden' ) === 'true' ) ).toBe( true );

		// The box is the font's, and the flip is what keeps the glyphs right way up.
		expect( svgs[ 0 ] ).toHaveAttribute(
			'viewBox',
			expect.stringMatching( /^0 -1037 [\d.]+ 1326$/ )
		);
		expect(
			// eslint-disable-next-line testing-library/no-node-access
			svgs.map( svg => svg.querySelector( 'g' )?.getAttribute( 'transform' ) )
		).toEqual( PANEL_LINES[ 0 ].map( () => 'scale(1, -1)' ) );
	} );

	it( 'joins the three start-screen lines into one hidden sentence', () => {
		setupWizard();

		// The start screen's copy runs to three lines where every other step's
		// runs to two, and the three are read as one sentence, not as fragments.
		expect( PANEL_LINES[ 0 ] ).toHaveLength( 3 );
		expect( panelCopy( 0 ) ).toHaveTextContent(
			'Grow your audience. Speed up your site. Keep it secure.'
		);
	} );
} );

describe( 'The site-type question', () => {
	const siteTypeStep = () => setupWizard( { isUserConnected: true } );

	const detailField = () =>
		screen.queryByRole( 'textbox', { name: 'Tell us what this site is for' } );

	it( 'offers the five answers, in the prototype’s order', () => {
		siteTypeStep();

		expect( screen.getAllByRole( 'radio' ).map( radio => radio.textContent ) ).toEqual( [
			'A blog or publication',
			'An online store',
			'A portfolio or personal site',
			'A business or brochure site',
			'Something else…',
		] );
	} );

	it( 'keeps the field shut until the answer that needs it is chosen', async () => {
		const { user } = siteTypeStep();

		expect( detailField() ).not.toBeInTheDocument();

		await user.click( screen.getByRole( 'radio', { name: 'A blog or publication' } ) );
		expect( detailField() ).not.toBeInTheDocument();
	} );

	it( 'opens the field on Something else, with focus already in it', async () => {
		const { user } = siteTypeStep();

		await user.click( screen.getByRole( 'radio', { name: 'Something else…' } ) );

		expect( detailField() ).toBeInTheDocument();
		expect( detailField() ).toHaveFocus();
	} );

	it( 'shuts the field again when another answer is chosen', async () => {
		const { user } = siteTypeStep();

		await user.click( screen.getByRole( 'radio', { name: 'Something else…' } ) );
		await user.type( detailField() as HTMLElement, 'A recipe site' );
		expect( detailField() ).toHaveValue( 'A recipe site' );

		await user.click( screen.getByRole( 'radio', { name: 'An online store' } ) );
		expect( detailField() ).not.toBeInTheDocument();
	} );

	// The one answer that is not from a fixed set, so it is the one that must not
	// be reported. Nothing is sent yet; this guards the shape when it is.
	it( 'holds what was typed without recording it', async () => {
		const { user } = siteTypeStep();

		await user.click( screen.getByRole( 'radio', { name: 'Something else…' } ) );
		await user.type( detailField() as HTMLElement, 'A recipe site' );

		expect(
			mockRecordEvent.mock.calls.some( call => JSON.stringify( call ).includes( 'recipe' ) )
		).toBe( false );
	} );
} );

describe( 'Leaving setup', () => {
	it( 'records a skip, then leaves', async () => {
		const { user } = setupWizard();

		await user.click( screen.getByRole( 'link', { name: 'Skip setup' } ) );

		expect( mockApiFetch ).toHaveBeenCalledWith( {
			path: '/my-jetpack/v1/site/onboarding/settled',
			method: 'POST',
			data: { outcome: 'skipped' },
		} );
	} );

	it( 'records a finish rather than a skip', async () => {
		const { user } = setupWizard( { isUserConnected: true } );

		// Walk to the last step, which is the only one that offers Finish.
		await user.click( screen.getByRole( 'radio', { name: 'A blog or publication' } ) );
		await user.click( screen.getByRole( 'button', { name: 'Continue' } ) );
		await user.click( screen.getByRole( 'button', { name: 'Continue' } ) );
		await user.click( await screen.findByRole( 'link', { name: 'Back to WordPress' } ) );

		expect( mockApiFetch ).toHaveBeenCalledWith( {
			path: '/my-jetpack/v1/site/onboarding/settled',
			method: 'POST',
			data: { outcome: 'completed' },
		} );
	} );

	// A failed write costs the user being offered setup once more. Being held on a
	// screen they asked to leave would cost a great deal more.
	it( 'leaves even when the record fails', async () => {
		mockApiFetch.mockRejectedValueOnce( new Error( 'nope' ) );
		const { user } = setupWizard();

		await user.click( screen.getByRole( 'link', { name: 'Skip setup' } ) );

		await waitFor( () => expect( assignedHref() ).toBe( exitUrl ) );
	} );
} );

describe( 'The feature step', () => {
	const featureStep = async ( user: UserEvent ) => {
		await user.click( screen.getByRole( 'radio', { name: 'A blog or publication' } ) );
		await user.click( screen.getByRole( 'button', { name: 'Continue' } ) );
	};

	it( 'lists the modules with Jetpack’s own names, every one switched on', async () => {
		const { user } = setupWizard( { isUserConnected: true } );
		await featureStep( user );

		expect( screen.getByRole( 'checkbox', { name: 'Jetpack Stats' } ) ).toBeChecked();
		expect( screen.getByRole( 'checkbox', { name: 'Downtime Monitor' } ) ).toBeChecked();
	} );

	/*
	 * Two things carrying the module's name is two announcements a row: the
	 * visible words, and a switch repeating them as its own aria-label.
	 */
	it( 'gives each module exactly one control, named by the row’s own words', async () => {
		const { user } = setupWizard( { isUserConnected: true } );
		await featureStep( user );

		const toggle = screen.getByRole( 'checkbox', { name: 'Jetpack Stats' } );

		expect( screen.getAllByRole( 'checkbox', { name: 'Jetpack Stats' } ) ).toHaveLength( 1 );
		expect( screen.getAllByText( 'Jetpack Stats' ) ).toHaveLength( 1 );
		expect( toggle ).not.toHaveAttribute( 'aria-label' );
		// The line under the name stays a description rather than joining the name.
		expect( toggle ).toHaveAccessibleDescription( 'Traffic insights.' );

		// The whole row is the target, not the 32x16 input.
		await user.click( screen.getByText( 'Jetpack Stats' ) );
		expect( toggle ).not.toBeChecked();
	} );

	it( 'asks for what the switches say, not for what the site already does', async () => {
		const { user } = setupWizard( { isUserConnected: true } );
		await featureStep( user );

		await user.click( screen.getByRole( 'checkbox', { name: 'Downtime Monitor' } ) );
		await user.click( screen.getByRole( 'button', { name: 'Continue' } ) );

		expect( mockApply ).toHaveBeenCalledWith( mockModules, { monitor: false } );
	} );

	// The worst thing this flow could do is tick a module that never came on.
	it( 'says which modules could not be changed', async () => {
		mockApply.mockResolvedValueOnce( [
			{ slug: 'stats', name: 'Jetpack Stats', wanted: true, ok: true },
			{ slug: 'monitor', name: 'Downtime Monitor', wanted: true, ok: false },
		] );

		const { user } = setupWizard( { isUserConnected: true } );
		await featureStep( user );
		await user.click( screen.getByRole( 'button', { name: 'Continue' } ) );

		await waitFor( () =>
			expect( heading() ).toHaveTextContent( 'Some features need another look' )
		);
		expect( screen.getByText( 'Not changed' ) ).toBeInTheDocument();
	} );

	it( 'does not claim a completion the user did not ask for', async () => {
		mockApply.mockResolvedValueOnce( [
			{ slug: 'stats', name: 'Jetpack Stats', wanted: false, ok: true },
			{ slug: 'monitor', name: 'Downtime Monitor', wanted: false, ok: true },
		] );

		const { user } = setupWizard( { isUserConnected: true } );
		await featureStep( user );
		await user.click( screen.getByRole( 'button', { name: 'Continue' } ) );

		await waitFor( () => expect( heading() ).toHaveTextContent( 'Nothing changed on your site' ) );
	} );

	it( 'says so plainly when every one of them is on', async () => {
		const { user } = setupWizard( { isUserConnected: true } );
		await featureStep( user );
		await user.click( screen.getByRole( 'button', { name: 'Continue' } ) );

		await waitFor( () => expect( heading() ).toHaveTextContent( "You're all set" ) );
	} );

	// Safari drops the list role off a `list-style: none` list, so the summary
	// has to say it or its rows read as loose text with no count.
	it( 'keeps the finish summary a list', async () => {
		const { user } = setupWizard( { isUserConnected: true } );
		await featureStep( user );
		await user.click( screen.getByRole( 'button', { name: 'Continue' } ) );

		const list = await screen.findByRole( 'list' );

		expect( list ).toHaveAttribute( 'role', 'list' );
		expect( within( list ).getAllByRole( 'listitem' ) ).toHaveLength( mockModules.length );
	} );
} );

describe( 'Guards on the way through', () => {
	// The wizard focuses you into a field; it should not then let you walk past it
	// and record "other" with nothing after it.
	it( 'will not commit Something else with nothing typed', async () => {
		const { user } = setupWizard( { isUserConnected: true } );

		await user.click( screen.getByRole( 'radio', { name: 'Something else…' } ) );
		// @wordpress/ui marks a blocked button aria-disabled and keeps it focusable,
		// rather than using the native attribute.
		expect( screen.getByRole( 'button', { name: 'Continue' } ) ).toHaveAttribute(
			'aria-disabled',
			'true'
		);

		await user.type(
			screen.getByRole( 'textbox', { name: 'Tell us what this site is for' } ),
			'A recipe site'
		);
		expect( screen.getByRole( 'button', { name: 'Continue' } ) ).not.toHaveAttribute(
			'aria-disabled',
			'true'
		);
	} );

	it( 'treats whitespace as nothing typed', async () => {
		const { user } = setupWizard( { isUserConnected: true } );

		await user.click( screen.getByRole( 'radio', { name: 'Something else…' } ) );
		await user.type(
			screen.getByRole( 'textbox', { name: 'Tell us what this site is for' } ),
			'   '
		);

		expect( screen.getByRole( 'button', { name: 'Continue' } ) ).toHaveAttribute(
			'aria-disabled',
			'true'
		);
	} );

	// Skipping records this person as having declined and never writes the
	// site-wide completion, so it must not be the way out of a finished flow.
	it( 'drops Skip setup once the work is done', async () => {
		const { user } = setupWizard( { isUserConnected: true } );

		expect( screen.getByRole( 'link', { name: 'Skip setup' } ) ).toBeInTheDocument();

		await advance( user, 2 );

		expect( screen.queryByRole( 'link', { name: 'Skip setup' } ) ).not.toBeInTheDocument();
		expect( screen.getByRole( 'link', { name: 'Back to WordPress' } ) ).toBeInTheDocument();
	} );

	// Every switch reports its own outcome, so a rejection is the request layer
	// itself giving out. The step must still move rather than sit on a spinner.
	it( 'still reaches the finish screen when switching blows up', async () => {
		mockApply.mockRejectedValueOnce( new Error( 'nope' ) );
		const { user } = setupWizard( { isUserConnected: true } );

		await user.click( screen.getByRole( 'radio', { name: 'A blog or publication' } ) );
		await user.click( screen.getByRole( 'button', { name: 'Continue' } ) );
		await user.click( screen.getByRole( 'button', { name: 'Continue' } ) );

		await waitFor( () => expect( heading() ).toHaveTextContent( 'Nothing changed on your site' ) );
	} );
} );

describe( 'Keyboard on the site-type question', () => {
	// Arrowing onto the row only previews it. Taking focus there is a trap: the
	// arrow keys belong to the radio group, and a text field swallows them.
	it( 'leaves focus on the row when Something else is arrowed onto', async () => {
		const { user } = setupWizard( { isUserConnected: true } );

		const radios = screen.getAllByRole( 'radio' );
		radios[ 3 ].focus();
		await user.keyboard( '{ArrowDown}' );

		expect( screen.getByRole( 'radio', { name: 'Something else…' } ) ).toHaveFocus();

		// And the list still wraps, which it cannot do from inside a text field.
		await user.keyboard( '{ArrowDown}' );
		expect( screen.getByRole( 'radio', { name: 'A blog or publication' } ) ).toHaveFocus();
	} );

	it( 'still moves focus into the field when the row is clicked', async () => {
		const { user } = setupWizard( { isUserConnected: true } );

		await user.click( screen.getByRole( 'radio', { name: 'Something else…' } ) );

		expect(
			screen.getByRole( 'textbox', { name: 'Tell us what this site is for' } )
		).toHaveFocus();
	} );
} );
