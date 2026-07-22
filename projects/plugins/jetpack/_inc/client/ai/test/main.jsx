import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import apiFetch from '@wordpress/api-fetch';
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
	apiFetch.mockReset();
	analytics.tracks.recordEvent.mockClear();
	window.location.hash = '#/features';
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

	test( 'save-confirmation: a successful AI-settings save shows the success notice', async () => {
		mockApiFetch( { featurePost: () => Promise.resolve( enabledSettings() ) } );

		render( <App /> );

		const toggle = await screen.findByRole( 'checkbox', { name: /Writing Assistant/ } );
		await userEvent.click( toggle );

		await expect(
			screen.findByText( 'Your AI settings have been saved.', IGNORE_A11Y )
		).resolves.toBeInTheDocument();
		// The error notice must not be showing on a success.
		expect(
			screen.queryByText( 'Failed to save AI settings. Please try again.', IGNORE_A11Y )
		).not.toBeInTheDocument();
	} );

	test( 'save-confirmation: a failed AI-settings save shows the error notice, not the success notice', async () => {
		mockApiFetch( { featurePost: () => Promise.reject( new Error( 'nope' ) ) } );

		render( <App /> );

		const toggle = await screen.findByRole( 'checkbox', { name: /Writing Assistant/ } );
		await userEvent.click( toggle );

		await expect(
			screen.findByText( 'Failed to save AI settings. Please try again.', IGNORE_A11Y )
		).resolves.toBeInTheDocument();
		expect(
			screen.queryByText( 'Your AI settings have been saved.', IGNORE_A11Y )
		).not.toBeInTheDocument();
	} );

	test( 'MCP view tracking: fires once on the MCP tab, never on Features, and latches per mount', async () => {
		mockApiFetch( {
			mcpGet: { has_mcp_access: true, mcp_abilities: { account: { some_tool: {} }, sites: [] } },
		} );

		window.location.hash = '#/mcp';
		render( <App /> );

		await waitFor( () => expect( mcpViewCount() ).toBe( 1 ) );

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
