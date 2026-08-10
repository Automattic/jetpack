import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import apiFetch from '@wordpress/api-fetch';
import { dispatch, select } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';
import analytics from 'lib/analytics';
import App from '../main';

// main.jsx imports the webpack-aliased 'lib/analytics', which doesn't resolve
// under jest — provide it virtually. (jest.mock is hoisted above the imports.)
jest.mock( 'lib/analytics', () => ( { tracks: { recordEvent: jest.fn() } } ), { virtual: true } );

// Both settings hooks fetch through @wordpress/api-fetch; stub it so nothing
// hits the network and each test controls the GET/POST responses.
jest.mock( '@wordpress/api-fetch' );

// main.jsx uses Tabs as nav-only (no Tabs.Panel), which trips the design
// system's async a11y validation — a console.error the shared jest-console
// setup treats as a test failure. Swap only Tabs for inert passthroughs; the
// real Notice/Stack are kept because the assertions below rely on them.
jest.mock( '@wordpress/ui', () => {
	const actual = jest.requireActual( '@wordpress/ui' );
	const { createElement } = require( 'react' );
	const passthrough =
		tag =>
		( { children } ) =>
			createElement( tag, null, children );
	return {
		...actual,
		Tabs: { Root: passthrough( 'div' ), List: passthrough( 'div' ), Tab: passthrough( 'button' ) },
	};
} );

// A settings response with one usable, enabled feature row.
const enabledSettings = () => ( {
	host_allows_ai: true,
	master_enabled: true,
	is_connected: true,
	plan: { supports_ai: true },
	features: { writing_assistant: { enabled: true } },
} );

/**
 * Route apiFetch by endpoint and method.
 *
 * @param {object}   options             - Response shapes.
 * @param {object}   options.featureGet  - GET /jetpack-ai/feature-settings body.
 * @param {object}   options.mcpGet      - GET /jetpack-ai/mcp-settings body.
 * @param {Function} options.featurePost - POST /jetpack-ai/feature-settings handler → Promise.
 */
function mockApiFetch( { featureGet = enabledSettings(), mcpGet = {}, featurePost } = {} ) {
	apiFetch.mockImplementation( ( { path, method } = {} ) => {
		if ( path?.includes( 'feature-settings' ) ) {
			if ( method === 'POST' ) {
				return featurePost ? featurePost() : Promise.resolve( enabledSettings() );
			}
			return Promise.resolve( featureGet );
		}
		if ( path?.includes( 'mcp-settings' ) ) {
			return Promise.resolve( mcpGet );
		}
		return Promise.resolve( {} );
	} );
}

// The design-system Notice mirrors its text into a hidden wp.a11y.speak live
// region, so a bare text query matches twice. Ignore that region.
const IGNORE_A11Y = { ignore: 'script, style, .a11y-speak-region' };

const mcpViewCount = () =>
	analytics.tracks.recordEvent.mock.calls.filter(
		call => call[ 0 ] === 'jetpack_mcp_settings_viewed'
	).length;

beforeEach( () => {
	// GlobalNotices renders SnackbarList, whose framer-motion animations
	// measure keyframes via window.scrollTo — not implemented in jsdom.
	jest.spyOn( window, 'scrollTo' ).mockImplementation();
	apiFetch.mockReset();
	analytics.tracks.recordEvent.mockClear();
	// The suite renders as an internal tester by default so the Features view
	// is reachable; the a11n-gate tests below override this per test.
	window.jetpackAiSettings = { showFeaturesView: true };
	window.location.hash = '#/features';
} );

afterEach( () => {
	// Tests that exercise the internal-testing flag set this global.
	delete window.jetpackAiSettings;
	// The @wordpress/notices store is module-global: drain it so a snackbar
	// created in one test cannot re-animate into the next test's render.
	select( noticesStore )
		.getNotices()
		.forEach( notice => dispatch( noticesStore ).removeNotice( notice.id ) );
} );

describe( 'AI admin page (main.jsx)', () => {
	test( 'host-off: shows the host-off notice and does not mount AiFeatures', async () => {
		mockApiFetch( {
			featureGet: {
				host_allows_ai: false,
				features: { writing_assistant: { enabled: true } },
			},
		} );

		render( <App /> );

		await expect(
			screen.findByText( 'AI has been turned off for this site.', IGNORE_A11Y )
		).resolves.toBeInTheDocument();

		// AiFeatures never mounts: no feature toggle, no upgrade badge, no action link.
		expect( screen.queryByRole( 'checkbox' ) ).not.toBeInTheDocument();
		expect( screen.queryByText( 'Requires upgrade' ) ).not.toBeInTheDocument();
		expect( screen.queryByText( 'Try it out in the editor' ) ).not.toBeInTheDocument();
		expect( screen.queryByText( 'Learn more' ) ).not.toBeInTheDocument();
	} );

	test( 'save-confirmation: a successful AI-settings save shows a success snackbar', async () => {
		mockApiFetch( { featurePost: () => Promise.resolve( enabledSettings() ) } );

		render( <App /> );

		const toggle = await screen.findByRole( 'checkbox', { name: /Writing Assistant/ } );
		await userEvent.click( toggle );

		// Save feedback is transient, so it renders through the shared
		// GlobalNotices snackbars (the design-system SnackbarList), not a
		// persistent Notice banner. The snackbar's signature is its
		// click-to-dismiss button wrapper.
		const snackbar = await screen.findByRole( 'button', { name: 'Dismiss this notice' } );
		expect( snackbar ).toHaveTextContent( 'Your AI settings have been saved.' );
		// The error feedback must not be showing on a success.
		expect(
			screen.queryByText( 'Failed to save AI settings. Please try again.', IGNORE_A11Y )
		).not.toBeInTheDocument();
	} );

	test( 'save-confirmation: a failed AI-settings save shows an explicit-dismiss error snackbar', async () => {
		mockApiFetch( { featurePost: () => Promise.reject( new Error( 'nope' ) ) } );

		render( <App /> );

		const toggle = await screen.findByRole( 'checkbox', { name: /Writing Assistant/ } );
		await userEvent.click( toggle );

		await expect(
			screen.findByText( 'Failed to save AI settings. Please try again.', IGNORE_A11Y )
		).resolves.toBeInTheDocument();
		// Errors must not auto-vanish before they're read: the error snackbar
		// uses explicitDismiss, so the pill itself is not click-to-dismiss —
		// a dedicated ✕ button (which carries no message text) dismisses it.
		const dismiss = screen.getByRole( 'button', { name: 'Dismiss this notice' } );
		expect( dismiss ).not.toHaveTextContent( 'Failed to save AI settings. Please try again.' );
		expect(
			screen.queryByText( 'Your AI settings have been saved.', IGNORE_A11Y )
		).not.toBeInTheDocument();
	} );

	test( 'save-confirmation: a successful retry replaces the sticky error snackbar', async () => {
		// The error pill persists until dismissed (explicitDismiss) — but a
		// retry that succeeds must not leave the screen asserting failure and
		// success at once. Sharing one notice id makes the store replace the
		// previous outcome: last outcome wins.
		let calls = 0;
		mockApiFetch( {
			featurePost: () => {
				calls++;
				return calls === 1
					? Promise.reject( new Error( 'nope' ) )
					: Promise.resolve( enabledSettings() );
			},
		} );

		render( <App /> );

		const toggle = await screen.findByRole( 'checkbox', { name: /Writing Assistant/ } );
		await userEvent.click( toggle );
		await expect(
			screen.findByText( 'Failed to save AI settings. Please try again.', IGNORE_A11Y )
		).resolves.toBeInTheDocument();

		await userEvent.click( toggle );

		await expect(
			screen.findByText( 'Your AI settings have been saved.', IGNORE_A11Y )
		).resolves.toBeInTheDocument();
		expect(
			screen.queryByText( 'Failed to save AI settings. Please try again.', IGNORE_A11Y )
		).not.toBeInTheDocument();
	} );

	test( 'internal-testing flag: the Features tab carries an A12s only badge', async () => {
		// The Features view is gated to internal testing environments; when the
		// injected flag says we are in one, the tab must say so — Automatticians
		// should not mistake the view for public UI.
		window.jetpackAiSettings = { showFeaturesView: true };
		mockApiFetch();

		render( <App /> );

		await expect( screen.findByText( 'A12s only' ) ).resolves.toBeInTheDocument();
	} );

	test( 'no internal-testing flag: no A12s only badge renders', async () => {
		// Without the flag the gate hides the Features view entirely (MCP-only
		// shape), so the internal-testing label must not appear anywhere.
		window.jetpackAiSettings = {};
		mockApiFetch();

		render( <App /> );

		await expect(
			screen.findByText(
				'This site is not connected to WordPress.com. Please connect Jetpack to manage MCP settings.',
				IGNORE_A11Y
			)
		).resolves.toBeInTheDocument();
		expect( screen.queryByText( 'A12s only' ) ).not.toBeInTheDocument();
	} );

	test( 'MCP view tracking: fires once on the MCP tab, never on Features, and latches per mount', async () => {
		mockApiFetch( {
			mcpGet: { has_mcp_access: true, mcp_abilities: { account: { some_tool: {} }, sites: [] } },
		} );

		window.location.hash = '#/mcp';
		render( <App /> );

		await waitFor( () => expect( mcpViewCount() ).toBe( 1 ) );

		// Pin the event's property contract: `ref` follows the AI Tracks standard.
		const settingsViewedCall = analytics.tracks.recordEvent.mock.calls.find(
			call => call[ 0 ] === 'jetpack_mcp_settings_viewed'
		);
		expect( settingsViewedCall[ 1 ] ).toEqual( { ref: 'jetpack-ai-mcp-settings' } );

		// The useRef latch: leaving and re-entering the MCP context on the same
		// mounted instance does not re-fire the view event.
		act( () => {
			window.location.hash = '#/features';
			window.dispatchEvent( new Event( 'hashchange' ) );
			window.location.hash = '#/mcp';
			window.dispatchEvent( new Event( 'hashchange' ) );
		} );

		await waitFor( () => expect( mcpViewCount() ).toBe( 1 ) );
	} );

	test( 'a11n gate: without showFeaturesView the page is MCP-only with no tab bar', async () => {
		window.jetpackAiSettings = {};
		window.location.hash = '';
		mockApiFetch();

		render( <App /> );

		// Lands on the MCP view: this suite injects no blogId, so the MCP
		// not-connected notice is the view's settled state.
		await expect(
			screen.findByText(
				'This site is not connected to WordPress.com. Please connect Jetpack to manage MCP settings.',
				IGNORE_A11Y
			)
		).resolves.toBeInTheDocument();

		// No Features UI and no tab bar (a single tab renders no tabs at all).
		expect( screen.queryByText( 'WordPress Agent' ) ).not.toBeInTheDocument();
		expect( screen.queryByText( 'MCP Settings' ) ).not.toBeInTheDocument();
		expect(
			screen.queryByRole( 'checkbox', { name: /Writing Assistant/ } )
		).not.toBeInTheDocument();
	} );

	test( 'a11n gate: a #/features deep link falls back to the MCP view when gated', async () => {
		window.jetpackAiSettings = {};
		window.location.hash = '#/features';
		mockApiFetch();

		render( <App /> );

		await expect(
			screen.findByText(
				'This site is not connected to WordPress.com. Please connect Jetpack to manage MCP settings.',
				IGNORE_A11Y
			)
		).resolves.toBeInTheDocument();
		expect(
			screen.queryByRole( 'checkbox', { name: /Writing Assistant/ } )
		).not.toBeInTheDocument();
	} );

	test( 'a11n gate: with showFeaturesView the tab bar shows and WordPress Agent is the default view', async () => {
		window.location.hash = '';
		mockApiFetch();

		render( <App /> );

		await expect(
			screen.findByRole( 'checkbox', { name: /Writing Assistant/ } )
		).resolves.toBeInTheDocument();
		expect( screen.getByText( 'WordPress Agent' ) ).toBeInTheDocument();
		expect( screen.getByText( 'MCP Settings' ) ).toBeInTheDocument();
	} );

	test( 'MCP view tracking: does not fire on the Features tab', async () => {
		mockApiFetch( {
			mcpGet: { has_mcp_access: true, mcp_abilities: { account: { some_tool: {} }, sites: [] } },
		} );

		// Default hash is #/features (set in beforeEach).
		render( <App /> );

		// Wait for the Features view to settle, then confirm no MCP view event.
		await expect(
			screen.findByRole( 'checkbox', { name: /Writing Assistant/ } )
		).resolves.toBeInTheDocument();
		expect( mcpViewCount() ).toBe( 0 );
	} );
} );
