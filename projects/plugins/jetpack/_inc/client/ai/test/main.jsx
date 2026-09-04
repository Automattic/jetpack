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
jest.mock( '@automattic/jetpack-ai-client', () => ( { requestJwt: jest.fn() } ) );

// Both settings hooks fetch through @wordpress/api-fetch; stub it so nothing
// hits the network and each test controls the GET/POST responses.
jest.mock( '@wordpress/api-fetch' );

// Swap Tabs for lightweight stand-ins; the real Notice/Stack are kept because
// the assertions below rely on them. The stand-ins keep the Base UI contracts
// main.jsx depends on: aria-selected marks the tab matching the Root value,
// a consumer onClick always runs, and onValueChange fires on click EXCEPT for
// the already-selected tab — which is why main.jsx needs its own onClick to
// leave a sub-view via the (selected) MCP tab.
jest.mock( '@wordpress/ui', () => {
	const actual = jest.requireActual( '@wordpress/ui' );
	const { createContext, createElement, useContext } = require( 'react' );
	const TabsContext = createContext( {} );
	const passthrough =
		tag =>
		( { children } ) =>
			createElement( tag, null, children );
	return {
		...actual,
		Tabs: {
			Root: ( { children, value, onValueChange } ) =>
				createElement( TabsContext.Provider, { value: { value, onValueChange } }, children ),
			List: passthrough( 'div' ),
			Tab: ( { children, value, onClick } ) => {
				const { value: selected, onValueChange } = useContext( TabsContext );
				const handleClick = event => {
					onClick?.( event );
					if ( value !== selected ) {
						onValueChange?.( value );
					}
				};
				return createElement(
					'button',
					{ role: 'tab', 'aria-selected': value === selected, onClick: handleClick },
					children
				);
			},
			Panel: passthrough( 'div' ),
		},
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
		if ( path?.includes( 'ai-assistant-feature' ) ) {
			// A free-plan shape: the Overview usage card renders only for a
			// payload that positively identifies the free tier.
			return Promise.resolve( {
				'requests-count': 12,
				'requests-limit': 20,
				'current-tier': { value: 0, limit: 20 },
			} );
		}
		return Promise.resolve( {} );
	} );
}

// The design-system Notice mirrors its text into a hidden wp.a11y.speak live
// region, so a bare text query matches twice. Ignore that region.
const IGNORE_A11Y = { ignore: 'script, style, .a11y-speak-region' };

// An MCP payload for a connected site with MCP enabled: account tools make
// hasMcpAccess true, and the sites entry makes getSiteLevelEnabled true for
// blogId 1 — so the hub body (rows included) renders.
const connectedMcpGet = () => ( {
	has_mcp_access: true,
	mcp_abilities: {
		account: { some_tool: { title: 'Some tool', enabled: true } },
		sites: [ { blog_id: 1, site_level_enabled: true } ],
	},
} );

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
	// The suite renders with the host-gated Features view available by default.
	window.jetpackAiSettings = { showFeaturesView: true };
	window.location.hash = '#/features';
} );

afterEach( () => {
	delete window.jetpackAiSettings;
	delete window.__agentsManagerActions;
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
			screen.findByText( 'Jetpack AI is not available for this site.', IGNORE_A11Y )
		).resolves.toBeInTheDocument();

		// AiFeatures never mounts: no feature toggle, no upgrade badge, no action link.
		expect( screen.queryByRole( 'checkbox' ) ).not.toBeInTheDocument();
		expect( screen.queryByText( 'Requires upgrade' ) ).not.toBeInTheDocument();
		// The only Learn more left is the notice's own, pointing at core's wp_supports_ai reference.
		expect( screen.getByRole( 'link', { name: /Learn more/ } ) ).toHaveAttribute(
			'href',
			expect.stringContaining( 'source=jetpack-ai-hub-docs-wp-supports-ai' )
		);
	} );

	describe( 'master-off notice', () => {
		const MASTER_OFF_TITLE = 'Jetpack AI is turned off for this site.';
		const masterOffSettings = () => ( { ...enabledSettings(), master_enabled: false } );

		test( 'features tab: notice with the My Jetpack link, rendered exactly once', async () => {
			mockApiFetch( { featureGet: masterOffSettings() } );

			render( <App /> );

			await expect(
				screen.findByText( MASTER_OFF_TITLE, IGNORE_A11Y )
			).resolves.toBeInTheDocument();
			expect( screen.getByRole( 'link', { name: 'Manage in My Jetpack' } ) ).toHaveAttribute(
				'href',
				'admin.php?page=my-jetpack#/products'
			);
			// One page-level notice — AiFeatures must not render a second copy.
			expect( screen.getAllByText( MASTER_OFF_TITLE, IGNORE_A11Y ) ).toHaveLength( 1 );
			expect( screen.getByRole( 'checkbox', { name: /Writing Assistant/ } ) ).toBeDisabled();
		} );

		test( 'overview tab: the notice shows', async () => {
			window.jetpackAiSettings = { showFeaturesView: true, blogId: 1 };
			window.location.hash = '#/overview';
			mockApiFetch( { featureGet: masterOffSettings() } );

			render( <App /> );

			await expect(
				screen.findByText( MASTER_OFF_TITLE, IGNORE_A11Y )
			).resolves.toBeInTheDocument();
		} );

		test( 'MCP tab: the notice does not show and the hub stays functional', async () => {
			window.jetpackAiSettings = { showFeaturesView: true, blogId: 1 };
			window.location.hash = '#/mcp';
			mockApiFetch( { featureGet: masterOffSettings(), mcpGet: connectedMcpGet() } );

			render( <App /> );

			const mcpToggle = await screen.findByRole( 'checkbox', { name: 'Enable MCP access' } );
			expect( mcpToggle ).toBeChecked();
			expect( mcpToggle ).toBeEnabled();
			expect( screen.queryByText( MASTER_OFF_TITLE, IGNORE_A11Y ) ).not.toBeInTheDocument();
		} );

		test( 'scheduled tasks tab: the notice does not show', async () => {
			window.jetpackAiSettings = {
				showFeaturesView: true,
				blogId: 1,
				featureFlags: { 'ai-hub-scheduled-tasks': true },
			};
			window.location.hash = '#/scheduled-tasks';
			window.__agentsManagerActions = {
				isReady: true,
				chatNavigate: jest.fn(),
				setChatDocked: jest.fn(),
				setChatOpen: jest.fn(),
			};
			mockApiFetch( { featureGet: masterOffSettings() } );

			render( <App /> );

			await expect(
				screen.findByRole( 'button', { name: 'Try again' } )
			).resolves.toBeInTheDocument();
			expect( screen.queryByText( MASTER_OFF_TITLE, IGNORE_A11Y ) ).not.toBeInTheDocument();
		} );

		test( 'not connected: the connect ask wins over the master-off notice', async () => {
			mockApiFetch( { featureGet: { ...masterOffSettings(), is_connected: false } } );

			render( <App /> );

			await expect(
				screen.findByText( 'Jetpack is not connected to WordPress.com.', IGNORE_A11Y )
			).resolves.toBeInTheDocument();
			expect( screen.queryByText( MASTER_OFF_TITLE, IGNORE_A11Y ) ).not.toBeInTheDocument();
		} );

		test( 'host off: only the host notice shows', async () => {
			mockApiFetch( { featureGet: { ...masterOffSettings(), host_allows_ai: false } } );

			render( <App /> );

			await expect(
				screen.findByText( 'Jetpack AI is not available for this site.', IGNORE_A11Y )
			).resolves.toBeInTheDocument();
			expect( screen.queryByText( MASTER_OFF_TITLE, IGNORE_A11Y ) ).not.toBeInTheDocument();
		} );

		test( 'MCP sub-view: the notice does not show there either', async () => {
			window.location.hash = '#/read';
			mockApiFetch( { featureGet: masterOffSettings(), mcpGet: connectedMcpGet() } );

			render( <App /> );

			await expect(
				screen.findByRole( 'button', { name: 'Jetpack AI' } )
			).resolves.toBeInTheDocument();
			expect( screen.queryByText( MASTER_OFF_TITLE, IGNORE_A11Y ) ).not.toBeInTheDocument();
		} );
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

	test( 'internal-testing flag: every gated tab carries an A12s only badge', async () => {
		window.jetpackAiSettings = { showFeaturesView: true, showA12sBadge: true };
		mockApiFetch();

		render( <App /> );

		await expect( screen.findAllByText( 'A12s only' ) ).resolves.toHaveLength( 2 );
	} );

	test( 'scheduled tasks flag: exposes the gated hash route and Figma empty state', async () => {
		window.jetpackAiSettings = {
			featureFlags: { 'ai-hub-scheduled-tasks': true },
		};
		window.location.hash = '#/scheduled-tasks';
		window.__agentsManagerActions = {
			// The sandbox's agents manager currently exposes readiness as a boolean.
			isReady: true,
			chatNavigate: jest.fn(),
			setChatDocked: jest.fn(),
			setChatOpen: jest.fn(),
		};
		mockApiFetch();

		render( <App /> );

		await expect(
			screen.findByText( 'Schedule tasks for repeated work' )
		).resolves.toBeInTheDocument();
		expect( screen.getByText( 'Scheduled tasks' ) ).toBeInTheDocument();
		expect( screen.queryByText( 'A12s only' ) ).not.toBeInTheDocument();

		await userEvent.click( screen.getByRole( 'button', { name: 'Create a task' } ) );
		expect( window.__agentsManagerActions.chatNavigate ).toHaveBeenCalledWith( '/' );
		expect( window.__agentsManagerActions.setChatDocked ).not.toHaveBeenCalled();
		expect( window.__agentsManagerActions.setChatOpen ).toHaveBeenCalledWith( true );
		delete window.__agentsManagerActions;
	} );

	test( 'public self-hosted views have no A12s only badge', async () => {
		window.jetpackAiSettings = { showFeaturesView: true, showA12sBadge: false };
		mockApiFetch();

		render( <App /> );

		await expect( screen.findByText( 'Writing Assistant' ) ).resolves.toBeInTheDocument();
		expect( screen.queryByText( 'A12s only' ) ).not.toBeInTheDocument();
	} );

	test( 'MCP view tracking: fires once on the MCP tab, never on Features, and latches per mount', async () => {
		// A successful settings payload implies a connected site, so the fixture
		// carries the blogId (the fetch is skipped entirely without one).
		window.jetpackAiSettings = { showFeaturesView: true, blogId: 1 };
		mockApiFetch( {
			mcpGet: { has_mcp_access: true, mcp_abilities: { account: { some_tool: {} }, sites: [] } },
		} );

		window.location.hash = '#/mcp';
		render( <App /> );

		await waitFor( () => expect( mcpViewCount() ).toBe( 1 ) );

		// Pin the event's property contract: `ref` follows the AI Tracks standard,
		// and the audience properties default to 'false' when the page injects no
		// isA11n/isTest values (AIINT-586).
		const settingsViewedCall = analytics.tracks.recordEvent.mock.calls.find(
			call => call[ 0 ] === 'jetpack_mcp_settings_viewed'
		);
		expect( settingsViewedCall[ 1 ] ).toEqual( {
			is_a11n: 'false',
			is_test: 'false',
			ref: 'jetpack-ai-mcp-settings',
		} );

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

	describe( 'MCP view: connect card', () => {
		const CONNECT_CARD_TEXT = 'A user connection lets agents securely act on your behalf.';
		const UPSELL_CTA = 'Upgrade plan';

		beforeEach( () => {
			window.location.hash = '#/mcp';
		} );

		test( 'site connected, no plan: shows the connect card instead of the upsell', async () => {
			window.jetpackAiSettings = { showFeaturesView: true, blogId: 1, isUserConnected: false };
			mockApiFetch( { mcpGet: { has_mcp_access: false, mcp_abilities: {} } } );

			render( <App /> );

			await expect(
				screen.findByText( CONNECT_CARD_TEXT, IGNORE_A11Y )
			).resolves.toBeInTheDocument();
			expect(
				screen.getByRole( 'heading', { name: 'Connect AI agents to your site' } )
			).toBeInTheDocument();
			expect( screen.getByRole( 'link', { name: 'Connect your user account' } ) ).toHaveAttribute(
				'href',
				'admin.php?page=my-jetpack#/connection'
			);
			expect(
				screen.queryByText( 'Upgrade your plan to give external AI agents access to your site.' )
			).not.toBeInTheDocument();
			expect( screen.queryByText( UPSELL_CTA ) ).not.toBeInTheDocument();
			// The settings fetch is skipped: without a user token it can only fail.
			expect( apiFetch ).not.toHaveBeenCalledWith(
				expect.objectContaining( { path: expect.stringContaining( 'mcp-settings' ) } )
			);
		} );

		test( 'the connect card uses the supplied connection screen', async () => {
			window.jetpackAiSettings = {
				showFeaturesView: true,
				blogId: 1,
				isUserConnected: false,
				userConnectionUrl: 'admin.php?page=jetpack#/connect-user',
			};
			mockApiFetch( { mcpGet: { has_mcp_access: false, mcp_abilities: {} } } );

			render( <App /> );

			await expect(
				screen.findByText( CONNECT_CARD_TEXT, IGNORE_A11Y )
			).resolves.toBeInTheDocument();
			expect( screen.getByRole( 'link', { name: 'Connect your user account' } ) ).toHaveAttribute(
				'href',
				'admin.php?page=jetpack#/connect-user'
			);
		} );

		test( 'site connected, has plan: shows the connect card and not the hub', async () => {
			window.jetpackAiSettings = { showFeaturesView: true, blogId: 1, isUserConnected: false };
			mockApiFetch( { mcpGet: connectedMcpGet() } );

			render( <App /> );

			await expect(
				screen.findByText( CONNECT_CARD_TEXT, IGNORE_A11Y )
			).resolves.toBeInTheDocument();
			// The skipped fetch keeps hasMcpAccess null, so the hub cannot render.
			expect(
				screen.queryByText( 'External AI agent access', IGNORE_A11Y )
			).not.toBeInTheDocument();
			expect( screen.queryByLabelText( 'Enable MCP access' ) ).not.toBeInTheDocument();
		} );

		test( 'unlinked user: no settings request escapes and no error notice appears', async () => {
			// The fetch is skipped for unlinked users: the rejecting mock proves no request escapes.
			window.jetpackAiSettings = { showFeaturesView: true, blogId: 1, isUserConnected: false };
			apiFetch.mockImplementation( ( { path } = {} ) =>
				path?.includes( 'mcp-settings' )
					? Promise.reject( new Error( 'No token for user 2' ) )
					: Promise.resolve( enabledSettings() )
			);

			render( <App /> );

			await expect(
				screen.findByText( CONNECT_CARD_TEXT, IGNORE_A11Y )
			).resolves.toBeInTheDocument();
			expect( screen.queryByText( 'No token for user 2', IGNORE_A11Y ) ).not.toBeInTheDocument();
			expect( apiFetch ).not.toHaveBeenCalledWith(
				expect.objectContaining( { path: expect.stringContaining( 'mcp-settings' ) } )
			);
		} );

		test( 'linked user, settings request fails: the load error still shows', async () => {
			// The error branch must stay live for everyone the connect notice does
			// not cover.
			window.jetpackAiSettings = { showFeaturesView: true, blogId: 1, isUserConnected: true };
			apiFetch.mockImplementation( ( { path } = {} ) =>
				path?.includes( 'mcp-settings' )
					? Promise.reject( new Error( 'Something went wrong.' ) )
					: Promise.resolve( enabledSettings() )
			);

			render( <App /> );

			await expect(
				screen.findByText( 'Something went wrong.', IGNORE_A11Y )
			).resolves.toBeInTheDocument();
			expect( screen.queryByText( CONNECT_CARD_TEXT, IGNORE_A11Y ) ).not.toBeInTheDocument();
		} );

		test( 'isUserConnected undefined: behaviour unchanged, the upsell still shows', async () => {
			window.jetpackAiSettings = { showFeaturesView: true, blogId: 1 };
			mockApiFetch( { mcpGet: { has_mcp_access: false, mcp_abilities: {} } } );

			render( <App /> );

			await expect( screen.findByText( UPSELL_CTA ) ).resolves.toBeInTheDocument();
			expect( screen.queryByText( CONNECT_CARD_TEXT, IGNORE_A11Y ) ).not.toBeInTheDocument();
		} );

		test( 'site not connected: the site notice still comes first', async () => {
			// On a disconnected site the settings request could only reject (the
			// proxy has no site ID), so the fetch is skipped and the friendly
			// notice must show instead of that raw error.
			window.jetpackAiSettings = { showFeaturesView: true, isUserConnected: false };
			apiFetch.mockImplementation( ( { path } = {} ) =>
				path?.includes( 'mcp-settings' )
					? Promise.reject( new Error( 'Sorry, something is wrong with your Jetpack connection.' ) )
					: Promise.resolve( enabledSettings() )
			);

			render( <App /> );

			await expect(
				screen.findByText(
					'This site is not connected to WordPress.com. Please connect Jetpack to manage MCP settings.',
					IGNORE_A11Y
				)
			).resolves.toBeInTheDocument();
			expect(
				screen.queryByText( 'Sorry, something is wrong with your Jetpack connection.', IGNORE_A11Y )
			).not.toBeInTheDocument();
			expect( screen.queryByText( CONNECT_CARD_TEXT, IGNORE_A11Y ) ).not.toBeInTheDocument();
			expect( apiFetch ).not.toHaveBeenCalledWith(
				expect.objectContaining( { path: expect.stringContaining( 'mcp-settings' ) } )
			);
		} );
	} );

	test( 'MCP sub-views: the breadcrumb root reads Jetpack AI', async () => {
		mockApiFetch( {
			mcpGet: { has_mcp_access: true, mcp_abilities: { account: { some_tool: {} }, sites: [] } },
		} );

		window.location.hash = '#/read';
		render( <App /> );

		await expect(
			screen.findByRole( 'button', { name: 'Jetpack AI' } )
		).resolves.toBeInTheDocument();
		expect( screen.queryByRole( 'button', { name: 'AI' } ) ).not.toBeInTheDocument();
	} );

	test( 'MCP sub-views: the tab bar stays visible alongside the breadcrumbs', async () => {
		mockApiFetch( {
			mcpGet: { has_mcp_access: true, mcp_abilities: { account: { some_tool: {} }, sites: [] } },
		} );

		window.location.hash = '#/setup';
		render( <App /> );

		// Breadcrumbs render for the sub-view…
		await expect(
			screen.findByRole( 'button', { name: 'Jetpack AI' } )
		).resolves.toBeInTheDocument();
		// …and the top-level tabs are still there for navigation, with the
		// owning MCP tab marked selected (the view is nested under it).
		expect( screen.getByRole( 'tab', { name: 'MCP and Connectors' } ) ).toHaveAttribute(
			'aria-selected',
			'true'
		);
		expect( screen.getByRole( 'tab', { name: /Overview/ } ) ).toHaveAttribute(
			'aria-selected',
			'false'
		);
	} );

	test( 'MCP sub-views: clicking the MCP and Connectors tab returns to the hub', async () => {
		mockApiFetch( { mcpGet: connectedMcpGet() } );
		window.jetpackAiSettings = { showFeaturesView: true, blogId: 1 };

		window.location.hash = '#/setup';
		render( <App /> );

		// On the sub-view: breadcrumbs are present.
		await expect(
			screen.findByRole( 'button', { name: 'Jetpack AI' } )
		).resolves.toBeInTheDocument();

		// The MCP tab is selected here, and Tabs never emit the already-selected
		// value — this click only navigates through main.jsx's own tab onClick
		// (the regression this guards).
		await userEvent.click( screen.getByRole( 'tab', { name: 'MCP and Connectors' } ) );

		// Back on the hub: breadcrumbs are gone.
		await waitFor( () =>
			expect( screen.queryByRole( 'button', { name: 'Jetpack AI' } ) ).not.toBeInTheDocument()
		);
		expect( window.location.hash ).toBe( '#/mcp' );
	} );

	test( 'MCP sub-views: the back eyebrow names the parent and returns to the hub', async () => {
		mockApiFetch( { mcpGet: connectedMcpGet() } );
		window.jetpackAiSettings = { showFeaturesView: true, blogId: 1 };

		window.location.hash = '#/mcp/setup';
		render( <App /> );

		// The eyebrow's accessible name disambiguates it from the MCP tab.
		const eyebrow = await screen.findByRole( 'button', { name: 'Back to MCP and Connectors' } );
		await userEvent.click( eyebrow );

		// Back on the hub: breadcrumbs and the eyebrow itself are gone.
		await waitFor( () =>
			expect( screen.queryByRole( 'button', { name: 'Jetpack AI' } ) ).not.toBeInTheDocument()
		);
		expect(
			screen.queryByRole( 'button', { name: 'Back to MCP and Connectors' } )
		).not.toBeInTheDocument();
		expect( window.location.hash ).toBe( '#/mcp' );

		// The clicked eyebrow unmounted; focus must be restored to the
		// selected tab instead of silently dropping to <body>.
		expect( screen.getByRole( 'tab', { name: 'MCP and Connectors' } ) ).toHaveFocus();
	} );

	test( 'host gate: without showFeaturesView the page is MCP-only with no tab bar', async () => {
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
		expect( screen.queryByText( 'AI Features' ) ).not.toBeInTheDocument();
		expect( screen.queryByText( 'MCP and Connectors' ) ).not.toBeInTheDocument();
		expect(
			screen.queryByRole( 'checkbox', { name: /Writing Assistant/ } )
		).not.toBeInTheDocument();
	} );

	test( 'host gate: a #/features deep link falls back to the MCP view when gated', async () => {
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

	test( 'host gate: with showFeaturesView the tab bar shows and Overview is the default view', async () => {
		// Connected, so the Overview usage card renders rather than the
		// not-connected notice.
		window.jetpackAiSettings = { showFeaturesView: true, blogId: 1 };
		window.location.hash = '';
		mockApiFetch();

		render( <App /> );

		// Overview is the first tab, so it is the landing view (per the i4
		// design); the other tabs are present but not mounted.
		await expect(
			screen.findByText( 'Available requests', IGNORE_A11Y )
		).resolves.toBeInTheDocument();
		expect( screen.getByText( 'Overview' ) ).toBeInTheDocument();
		expect( screen.getByText( 'AI Features' ) ).toBeInTheDocument();
		expect( screen.getByText( 'MCP and Connectors' ) ).toBeInTheDocument();
		expect(
			screen.queryByRole( 'checkbox', { name: /Writing Assistant/ } )
		).not.toBeInTheDocument();
	} );

	test( 'overview tab: gate on: Overview is first and owns the activity log row — exactly once', async () => {
		window.jetpackAiSettings = {
			showFeaturesView: true,
			blogId: 1,
			activityLogUrl: 'https://example.com/activity',
			upgradeUrl: 'https://example.com/upgrade',
		};
		window.location.hash = '';
		mockApiFetch( { mcpGet: connectedMcpGet() } );

		render( <App /> );

		// Landing view is Overview; the row renders there and nowhere else.
		// Wait on the cheap text query: polling a role+name query re-computes
		// accessible names on every mutation and starves the 1s budget on a
		// loaded CI runner.
		await expect( screen.findByText( 'Activity log', IGNORE_A11Y ) ).resolves.toBeInTheDocument();
		const rows = screen.getAllByRole( 'link', { name: /Activity log/ } );
		expect( rows ).toHaveLength( 1 );
		expect( rows[ 0 ] ).toHaveAttribute( 'href', 'https://example.com/activity' );

		// On the MCP view the row must NOT render — Overview owns it while the
		// Overview tab exists (it would otherwise appear twice on one page).
		act( () => {
			window.location.hash = '#/mcp';
			window.dispatchEvent( new Event( 'hashchange' ) );
		} );
		await expect(
			screen.findByRole( 'checkbox', { name: 'Enable MCP access' } )
		).resolves.toBeInTheDocument();
		expect( screen.queryByRole( 'link', { name: /Activity log/ } ) ).not.toBeInTheDocument();
	} );

	test( 'overview tab: gate off: a #/overview deep link falls back to the MCP view', async () => {
		window.jetpackAiSettings = { blogId: 1, activityLogUrl: 'https://example.com/activity' };
		window.location.hash = '#/overview';
		mockApiFetch( { mcpGet: connectedMcpGet() } );

		render( <App /> );

		// The MCP hub settles — with its activity log row, exactly as today.
		await expect(
			screen.findByRole( 'checkbox', { name: 'Enable MCP access' } )
		).resolves.toBeInTheDocument();
		expect( screen.getAllByRole( 'link', { name: /Activity log/ } ) ).toHaveLength( 1 );
		// No Overview UI leaks through the gate.
		expect( screen.queryByText( 'Available requests', IGNORE_A11Y ) ).not.toBeInTheDocument();
		expect( screen.queryByText( 'Overview' ) ).not.toBeInTheDocument();
	} );

	test( 'activity log row: renders on the MCP hub as a link when MCP is enabled', async () => {
		// Gate off: the MCP hub is the row's home, conditional on the site
		// having an activity log URL and MCP being enabled.
		window.jetpackAiSettings = { blogId: 1, activityLogUrl: 'https://example.com/activity' };
		window.location.hash = '';
		mockApiFetch( { mcpGet: connectedMcpGet() } );

		render( <App /> );

		const row = await screen.findByRole( 'link', { name: /Activity log/ } );
		expect( row ).toHaveAttribute( 'href', 'https://example.com/activity' );
		expect( screen.getAllByRole( 'link', { name: /Activity log/ } ) ).toHaveLength( 1 );
	} );

	test( 'activity log row: absent from the MCP hub without an activityLogUrl', async () => {
		window.jetpackAiSettings = { blogId: 1 };
		window.location.hash = '';
		mockApiFetch( { mcpGet: connectedMcpGet() } );

		render( <App /> );

		// Settle on the hub (the site-level toggle is its stable anchor).
		await expect(
			screen.findByRole( 'checkbox', { name: 'Enable MCP access' } )
		).resolves.toBeInTheDocument();
		expect( screen.queryByRole( 'link', { name: /Activity log/ } ) ).not.toBeInTheDocument();
	} );

	test( 'MCP view tracking: does not fire on the Features tab', async () => {
		// blogId keeps the settings fetch live so hasMcpAccess resolves; the
		// isMcpContext guard is then the only thing holding the event back.
		window.jetpackAiSettings = { showFeaturesView: true, blogId: 1 };
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

	test( 'MCP audience properties: follow the injected isA11n/isTest page data as strings', async () => {
		// The audience properties are computed server-side and ride the
		// jetpackAiSettings global; the event must send the strings
		// 'true'/'false', not booleans (AIINT-576 encoding).
		window.jetpackAiSettings = { showFeaturesView: true, blogId: 1, isA11n: true, isTest: true };
		mockApiFetch( {
			mcpGet: { has_mcp_access: true, mcp_abilities: { account: { some_tool: {} }, sites: [] } },
		} );

		window.location.hash = '#/mcp';
		render( <App /> );

		await waitFor( () => expect( mcpViewCount() ).toBe( 1 ) );

		const settingsViewedCall = analytics.tracks.recordEvent.mock.calls.find(
			call => call[ 0 ] === 'jetpack_mcp_settings_viewed'
		);
		expect( settingsViewedCall[ 1 ] ).toMatchObject( { is_a11n: 'true', is_test: 'true' } );
	} );
} );
