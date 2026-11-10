import { useConnectionErrorNotice } from '@automattic/jetpack-connection';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import apiFetch from '@wordpress/api-fetch';
import { useViewportMatch } from '@wordpress/compose';
import { dispatch, select } from '@wordpress/data';
import { SnackbarNotices, store as noticesStore } from '@wordpress/notices';
import analytics from 'lib/analytics';
import Discover from '../discover';
import { closeSkillPanel, getOpenSkillSlug, isSkillPanelOpen } from '../discover/skill-panel-state';
import App from '../main';
// Compiles the lazy tab module before the tests run, so the flag test's 1s wait
// covers the render and not Jest's cold transform of DataViews on CI.
import '../scheduled-tasks/index';

// main.jsx imports the webpack-aliased 'lib/analytics', which doesn't resolve
// under jest — provide it virtually. (jest.mock is hoisted above the imports.)
jest.mock( 'lib/analytics', () => ( { tracks: { recordEvent: jest.fn() } } ), { virtual: true } );

// boot's layout renders the page's snackbars, so the app no longer mounts a
// list of its own. Pair them here to keep asserting on what a user reads.
const renderWithSnackbars = () =>
	render(
		<>
			<App />
			<SnackbarNotices />
		</>
	);
jest.mock( '@automattic/jetpack-ai-client/jwt', () => ( {
	__esModule: true,
	default: jest.fn(),
} ) );

jest.mock( '@automattic/jetpack-connection', () => ( {
	ConnectionError: () => <div data-testid="connection-error" />,
	useConnectionErrorNotice: jest.fn( () => ( { hasConnectionError: false } ) ),
} ) );
// Discover renders for real; the wrapper only records the props main.jsx hands it.
jest.mock( '../discover', () => {
	const actual = jest.requireActual( '../discover' );
	const { createElement } = require( 'react' );
	return {
		__esModule: true,
		...actual,
		default: jest.fn( props => createElement( actual.default, props ) ),
	};
} );
// jsdom has no matchMedia, so every viewport query answers false (wide) unless
// a test says otherwise.
jest.mock( '@wordpress/compose', () => ( {
	...jest.requireActual( '@wordpress/compose' ),
	useViewportMatch: jest.fn( () => false ),
} ) );
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

// The page notice mirrors its text into a hidden wp.a11y.speak live region,
// so a bare text query matches twice. Ignore that region.
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

// MCP's own warning for a site with no blog ID, on the trunk-shaped MCP view.
const MCP_NOT_CONNECTED =
	'This site is not connected to WordPress.com. Please connect Jetpack to manage MCP settings.';

// The MCP view's AI features section: a region named by its h2.
const AI_FEATURES_HEADING = { name: 'AI features', level: 2 };
const featuresSection = () => screen.getByRole( 'region', { name: 'AI features' } );

const tabNames = () => screen.getAllByRole( 'tab' ).map( tab => tab.textContent );

const mcpViewCount = () =>
	analytics.tracks.recordEvent.mock.calls.filter(
		call => call[ 0 ] === 'jetpack_mcp_settings_viewed'
	).length;

beforeEach( () => {
	// SnackbarNotices renders SnackbarList, whose framer-motion animations
	// measure keyframes via window.scrollTo — not implemented in jsdom.
	jest.spyOn( window, 'scrollTo' ).mockImplementation();
	apiFetch.mockReset();
	useConnectionErrorNotice.mockReturnValue( { hasConnectionError: false } );
	analytics.tracks.recordEvent.mockClear();
	// The suite renders the MCP view with its host-gated AI features section.
	window.jetpackAiSettings = { showFeaturesView: true };
	window.location.hash = '#/mcp';
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
	// Page data and the settings response answer the host gate in two different
	// requests. Page data is the one the notice reads, so the body must follow it
	// or the tab can end up with no card, no notice and no error.
	test( 'host gate: page data decides the body, not the settings response', async () => {
		window.jetpackAiSettings = { ...window.jetpackAiSettings, hostAllowsAi: true };
		mockApiFetch( {
			featureGet: {
				host_allows_ai: false,
				features: { writing_assistant: { enabled: true } },
			},
		} );

		render( <App /> );

		await expect(
			screen.findByRole( 'checkbox', { name: /Writing Assistant/ } )
		).resolves.toBeVisible();
		expect(
			screen.queryByText( 'Jetpack AI is not available for this site.', IGNORE_A11Y )
		).not.toBeInTheDocument();
	} );

	describe( 'Hub view tracking', () => {
		const hubViews = () =>
			analytics.tracks.recordEvent.mock.calls
				.filter( ( [ event ] ) => event === 'jetpack_ai_hub_viewed' )
				.map( ( [ , props ] ) => props );
		const viewedTabs = () => hubViews().map( ( { tab } ) => tab );

		beforeEach( () => {
			window.jetpackAiSettings = {
				showFeaturesView: true,
				blogId: 1,
				featureFlags: { 'ai-hub-scheduled-tasks': true },
			};
			mockApiFetch( { mcpGet: connectedMcpGet() } );
		} );

		test.each( [ 'overview', 'mcp', 'mcp/read', 'mcp/write', 'mcp/setup' ] )(
			'records a direct visit to %s once',
			async view => {
				window.history.replaceState( null, '', '#/' + view );
				const { rerender } = render( <App /> );

				await waitFor( () =>
					expect( hubViews() ).toEqual( [
						{
							site_type: 'jetpack',
							is_a11n: 'false',
							is_test: 'false',
							tab: view.split( '/' )[ 0 ],
						},
					] )
				);
				rerender( <App /> );
				expect( hubViews() ).toHaveLength( 1 );
			}
		);

		test( 'records an old #/features link as a visit to the MCP tab, naming the section', async () => {
			window.history.replaceState( null, '', '#/features' );
			render( <App /> );

			await waitFor( () =>
				expect( hubViews() ).toEqual( [
					{
						site_type: 'jetpack',
						is_a11n: 'false',
						is_test: 'false',
						tab: 'mcp',
						section: 'ai_features',
					},
				] )
			);
			expect( viewedTabs() ).not.toContain( 'features' );
		} );

		test( 'a #/features link followed from another tab names the section; a tab click does not', async () => {
			window.history.replaceState( null, '', '#/overview' );
			render( <App /> );
			await waitFor( () => expect( viewedTabs() ).toEqual( [ 'overview' ] ) );

			await act( async () => {
				window.history.replaceState( null, '', '#/features' );
				window.dispatchEvent( new Event( 'hashchange' ) );
			} );
			await userEvent.click( screen.getByRole( 'tab', { name: 'Overview' } ) );
			await userEvent.click( screen.getByRole( 'tab', { name: 'Settings' } ) );

			expect( hubViews().map( ( { tab, section } ) => [ tab, section ] ) ).toEqual( [
				[ 'overview', undefined ],
				[ 'mcp', 'ai_features' ],
				[ 'overview', undefined ],
				[ 'mcp', undefined ],
			] );
		} );

		test( 'behind the host gate a #/features link records no section, since there is none', async () => {
			window.jetpackAiSettings = { blogId: 1, featureFlags: { 'ai-hub-discover': true } };
			window.history.replaceState( null, '', '#/features' );
			render( <App /> );

			await waitFor( () => expect( viewedTabs() ).toEqual( [ 'mcp' ] ) );
			expect( hubViews()[ 0 ] ).not.toHaveProperty( 'section' );
		} );

		test( 'records a direct visit to scheduled-tasks once after the tab loads', async () => {
			window.history.replaceState( null, '', '#/scheduled-tasks' );
			const { rerender } = render( <App /> );

			await expect(
				screen.findByRole( 'button', { name: 'Try again' } )
			).resolves.toBeInTheDocument();
			expect( hubViews() ).toEqual( [
				{ site_type: 'jetpack', is_a11n: 'false', is_test: 'false', tab: 'scheduled-tasks' },
			] );
			rerender( <App /> );
			expect( hubViews() ).toHaveLength( 1 );
		} );

		test( 'records the default Overview visit and each tab change, including return visits', async () => {
			window.history.replaceState( null, '', window.location.pathname );
			render( <App /> );
			await waitFor( () => expect( viewedTabs() ).toEqual( [ 'overview' ] ) );

			await userEvent.click( screen.getByRole( 'tab', { name: 'Scheduled tasks' } ) );
			await expect(
				screen.findByRole( 'button', { name: 'Try again' } )
			).resolves.toBeInTheDocument();
			await userEvent.click( screen.getByRole( 'tab', { name: 'Settings' } ) );
			await userEvent.click( screen.getByRole( 'tab', { name: 'Overview' } ) );
			expect( viewedTabs() ).toEqual( [ 'overview', 'scheduled-tasks', 'mcp', 'overview' ] );
			expect( mcpViewCount() ).toBe( 1 );
			await userEvent.click( screen.getByRole( 'tab', { name: 'Overview' } ) );
			expect( hubViews() ).toHaveLength( 4 );
		} );

		test( 'records hash and history navigation without counting MCP sub-view changes', async () => {
			window.history.replaceState( null, '', '#/overview' );
			render( <App /> );

			for ( const [ view, event ] of [
				[ 'mcp', 'hashchange' ],
				[ 'mcp/read', 'hashchange' ],
				[ 'mcp/write', 'hashchange' ],
				[ 'mcp/setup', 'hashchange' ],
				[ 'mcp', 'popstate' ],
				// The old AI Features hash is the MCP tab, so it records nothing new.
				[ 'features', 'hashchange' ],
				[ 'overview', 'popstate' ],
			] ) {
				await act( async () => {
					window.history.replaceState( null, '', '#/' + view );
					window.dispatchEvent( new Event( event ) );
				} );
			}
			expect( viewedTabs() ).toEqual( [ 'overview', 'mcp', 'overview' ] );
			expect( mcpViewCount() ).toBe( 1 );
		} );

		test.each( [ '', '#/overview', '#/features', '#/mcp/setup' ] )(
			'keeps Hub tracking off when the Hub is hidden, with hash %s',
			async hash => {
				window.jetpackAiSettings = { blogId: 1 };
				window.history.replaceState( null, '', window.location.pathname + hash );
				render( <App /> );

				await waitFor( () => expect( mcpViewCount() ).toBe( 1 ) );
				expect( hubViews() ).toEqual( [] );
			}
		);

		// The tab bar, not the host gate, decides: either flag alone brings it.
		test.each( [
			[ 'Scheduled tasks', { 'ai-hub-scheduled-tasks': true } ],
			[ 'Discover', { 'ai-hub-discover': true } ],
		] )(
			'the %s flag alone shows the tab bar and enables Hub tracking',
			async ( _label, flags ) => {
				window.jetpackAiSettings = { blogId: 1, featureFlags: flags };
				window.history.replaceState( null, '', '#/mcp' );
				render( <App /> );

				await waitFor( () => expect( mcpViewCount() ).toBe( 1 ) );
				expect( hubViews() ).toEqual( [
					{ site_type: 'jetpack', is_a11n: 'false', is_test: 'false', tab: 'mcp' },
				] );
			}
		);

		test( 'records the visible fallback tab for a hidden Scheduled tasks deep link', async () => {
			delete window.jetpackAiSettings.featureFlags;
			window.history.replaceState( null, '', '#/scheduled-tasks' );
			render( <App /> );

			await waitFor( () => expect( viewedTabs() ).toEqual( [ 'overview' ] ) );
		} );
	} );

	test( 'host-off: shows the host-off notice and does not mount AiFeatures', async () => {
		window.jetpackAiSettings = { ...window.jetpackAiSettings, hostAllowsAi: false };
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
			expect.stringContaining( 'source=jetpack-ai-hub-notice-host-off' )
		);
	} );

	test( 'renders the shared JITM slot', async () => {
		mockApiFetch();

		render( <App /> );

		await expect(
			screen.findByRole( 'checkbox', { name: /Writing Assistant/ } )
		).resolves.toBeInTheDocument();
		expect( screen.getByTestId( 'jp-jitm-slot' ) ).toBeInTheDocument();
	} );

	describe( 'master-off notice', () => {
		const MASTER_OFF_TITLE = 'Jetpack AI is turned off for this site.';
		const masterOffSettings = () => ( { ...enabledSettings(), master_enabled: false } );
		// The notice reads page data; AiFeatures still reads the settings response.
		const masterOffPage = ( extra = {} ) => ( {
			...window.jetpackAiSettings,
			masterEnabled: false,
			...extra,
		} );

		test( 'MCP view: the AI features section carries the notice, rendered exactly once', async () => {
			window.jetpackAiSettings = masterOffPage( { showFeaturesView: true, blogId: 1 } );
			mockApiFetch( { featureGet: masterOffSettings() } );

			render( <App /> );

			await expect(
				screen.findByText( MASTER_OFF_TITLE, IGNORE_A11Y )
			).resolves.toBeInTheDocument();
			expect( screen.getByRole( 'link', { name: 'Manage in My Jetpack' } ) ).toHaveAttribute(
				'href',
				'admin.php?page=my-jetpack#/features'
			);
			// One page-level notice — AiFeatures must not render a second copy.
			expect( screen.getAllByText( MASTER_OFF_TITLE, IGNORE_A11Y ) ).toHaveLength( 1 );
			// It explains the feature toggles, so it lives in their section.
			expect( within( featuresSection() ).getByText( MASTER_OFF_TITLE ) ).toBeInTheDocument();
			await expect(
				screen.findByRole( 'checkbox', { name: /Writing Assistant/ } )
			).resolves.toBeDisabled();
		} );

		test( 'a host without My Jetpack is sent to the modules page instead', async () => {
			window.jetpackAiSettings = masterOffPage( {
				showFeaturesView: true,
				blogId: 1,
				hasMyJetpack: false,
				manageUrl: 'admin.php?page=jetpack_modules',
			} );
			mockApiFetch( { featureGet: masterOffSettings() } );

			render( <App /> );

			await expect(
				screen.findByRole( 'link', { name: 'Manage in Jetpack modules' } )
			).resolves.toHaveAttribute( 'href', 'admin.php?page=jetpack_modules' );
			expect(
				screen.queryByRole( 'link', { name: 'Manage in My Jetpack' } )
			).not.toBeInTheDocument();
		} );

		test( 'the notice sits above the view it applies to', async () => {
			window.jetpackAiSettings = masterOffPage( { showFeaturesView: true, blogId: 1 } );
			mockApiFetch( { featureGet: masterOffSettings() } );

			render( <App /> );

			await expect(
				screen.findByText( MASTER_OFF_TITLE, IGNORE_A11Y )
			).resolves.toBeInTheDocument();
			// getAllByText returns matches in document order.
			const [ first ] = screen.getAllByText(
				/Jetpack AI is turned off for this site\.|Writing Assistant/,
				IGNORE_A11Y
			);
			expect( first ).toHaveTextContent( MASTER_OFF_TITLE );
		} );

		test( 'the notice sits below the MCP content, under the section heading', async () => {
			window.jetpackAiSettings = masterOffPage( { showFeaturesView: true, blogId: 1 } );
			mockApiFetch( { featureGet: masterOffSettings(), mcpGet: connectedMcpGet() } );

			render( <App /> );

			await expect(
				screen.findByRole( 'checkbox', { name: 'Enable MCP access' } )
			).resolves.toBeInTheDocument();
			// getAllByText returns matches in document order.
			const order = screen
				.getAllByText(
					/^(Enable MCP access|AI features|Jetpack AI is turned off for this site\.)$/,
					IGNORE_A11Y
				)
				.map( node => node.textContent );
			expect( order ).toEqual( [ 'Enable MCP access', 'AI features', MASTER_OFF_TITLE ] );
		} );

		test( 'code holding the module off is named from page data, on first paint', async () => {
			window.location.hash = '#/overview';
			window.jetpackAiSettings = {
				showFeaturesView: true,
				blogId: 1,
				isUserConnected: true,
				masterForcedOff: 'filter',
			};
			mockApiFetch();

			render( <App /> );

			await expect(
				screen.findByText( 'Jetpack AI is turned off by custom code on this site.', IGNORE_A11Y )
			).resolves.toBeInTheDocument();
		} );

		test.each( [ 'filter', 'filter-vip', 'modules', 'future-reason' ] )(
			'%s disables every feature toggle without changing saved values',
			async masterForcedOff => {
				window.jetpackAiSettings = {
					showFeaturesView: true,
					blogId: 1,
					isUserConnected: true,
					masterForcedOff,
				};
				mockApiFetch( {
					featureGet: {
						...enabledSettings(),
						features: {
							writing_assistant: { enabled: true },
							image_editor: { enabled: false },
							ai_seo: { enabled: true },
							ai_search: { enabled: false },
						},
					},
				} );

				render( <App /> );

				const toggles = await screen.findAllByRole( 'checkbox' );
				expect( toggles ).toHaveLength( 4 );
				toggles.forEach( toggle => expect( toggle ).toBeDisabled() );
				expect( toggles.map( toggle => toggle.checked ) ).toEqual( [ true, false, true, false ] );
				await userEvent.click( toggles[ 0 ] );
				expect( apiFetch.mock.calls.some( ( [ request ] ) => request.method === 'POST' ) ).toBe(
					false
				);
			}
		);

		test.each( [ '', null, undefined ] )(
			'masterForcedOff=%s leaves usable feature toggles enabled',
			async masterForcedOff => {
				window.jetpackAiSettings = {
					showFeaturesView: true,
					blogId: 1,
					isUserConnected: true,
					masterForcedOff,
				};
				mockApiFetch();

				render( <App /> );

				await expect(
					screen.findByRole( 'checkbox', { name: /Writing Assistant/ } )
				).resolves.toBeEnabled();
			}
		);

		// Trunk shows the card in offline mode and on a broken connection; this PR
		// consolidates notices and must not quietly change that.
		test.each( [
			[ 'offline mode', { isOfflineMode: true } ],
			[ 'a broken connection', {} ],
		] )( 'overview tab: the usage card survives %s', async ( label, extra ) => {
			if ( label === 'a broken connection' ) {
				useConnectionErrorNotice.mockReturnValue( { hasConnectionError: true } );
			}
			window.jetpackAiSettings = {
				showFeaturesView: true,
				blogId: 1,
				isUserConnected: true,
				...extra,
			};
			window.location.hash = '#/overview';
			mockApiFetch();

			render( <App /> );

			await expect( screen.findByText( 'Available requests' ) ).resolves.toBeInTheDocument();
		} );

		// The usage endpoint answers for the account, not the module, so switching
		// AI off leaves the figures true and worth showing.
		test( 'overview tab: the usage card survives the master switch', async () => {
			window.jetpackAiSettings = masterOffPage( { showFeaturesView: true, blogId: 1 } );
			window.location.hash = '#/overview';
			mockApiFetch( { featureGet: masterOffSettings() } );

			render( <App /> );

			await expect(
				screen.findByText( MASTER_OFF_TITLE, IGNORE_A11Y )
			).resolves.toBeInTheDocument();
			await expect( screen.findByText( 'Available requests' ) ).resolves.toBeInTheDocument();
		} );

		test( 'overview tab: the notice shows', async () => {
			window.jetpackAiSettings = masterOffPage( { showFeaturesView: true, blogId: 1 } );
			window.location.hash = '#/overview';
			mockApiFetch( { featureGet: masterOffSettings() } );

			render( <App /> );

			await expect(
				screen.findByText( MASTER_OFF_TITLE, IGNORE_A11Y )
			).resolves.toBeInTheDocument();
		} );

		test( 'gated host: with no Overview tab or AI features section, no page notice appears', async () => {
			// showFeaturesView false means neither exists, so the page-level
			// slot must not start speaking for the MCP-only page.
			window.jetpackAiSettings = { blogId: 1 };
			window.location.hash = '#/mcp';
			mockApiFetch( { featureGet: masterOffSettings(), mcpGet: connectedMcpGet() } );

			render( <App /> );

			await expect(
				screen.findByRole( 'checkbox', { name: 'Enable MCP access' } )
			).resolves.toBeInTheDocument();
			expect( screen.queryByText( MASTER_OFF_TITLE, IGNORE_A11Y ) ).not.toBeInTheDocument();
			expect(
				screen.queryByText( 'This site is not connected to WordPress.com.', IGNORE_A11Y )
			).not.toBeInTheDocument();
			expect( screen.queryByRole( 'heading', AI_FEATURES_HEADING ) ).not.toBeInTheDocument();
		} );

		test( 'MCP tab: the notice speaks for the AI features and the hub stays functional', async () => {
			window.jetpackAiSettings = masterOffPage( { showFeaturesView: true, blogId: 1 } );
			window.location.hash = '#/mcp';
			mockApiFetch( { featureGet: masterOffSettings(), mcpGet: connectedMcpGet() } );

			render( <App /> );

			const mcpToggle = await screen.findByRole( 'checkbox', { name: 'Enable MCP access' } );
			expect( mcpToggle ).toBeChecked();
			expect( mcpToggle ).toBeEnabled();
			expect( within( featuresSection() ).getByText( MASTER_OFF_TITLE ) ).toBeInTheDocument();
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

		test( 'broken connection: the shared notice outranks the rest', async () => {
			window.location.hash = '#/overview';
			useConnectionErrorNotice.mockReturnValue( { hasConnectionError: true } );
			mockApiFetch( { featureGet: masterOffSettings() } );

			render( <App /> );

			await expect( screen.findByTestId( 'connection-error' ) ).resolves.toBeInTheDocument();
			expect( screen.queryByText( MASTER_OFF_TITLE, IGNORE_A11Y ) ).not.toBeInTheDocument();
		} );

		test( 'the usage card renders when nothing contradicts it', async () => {
			window.location.hash = '#/overview';
			window.jetpackAiSettings = { showFeaturesView: true, blogId: 1, isUserConnected: true };
			mockApiFetch( {} );

			render( <App /> );

			await expect( screen.findByText( 'Available requests' ) ).resolves.toBeInTheDocument();
		} );

		test( 'usage is asked for on first paint, without waiting on the settings call', async () => {
			window.location.hash = '#/overview';
			window.jetpackAiSettings = {
				showFeaturesView: true,
				blogId: 1,
				isUserConnected: true,
				isConnected: true,
			};
			// Never resolves: page data already says the site can use AI, so the
			// usage request must not queue behind it.
			apiFetch.mockImplementation( ( { path } = {} ) =>
				path?.includes( 'feature-settings' ) ? new Promise( () => {} ) : Promise.resolve( {} )
			);

			render( <App /> );

			await expect( screen.findByText( 'Connect your AI agent' ) ).resolves.toBeInTheDocument();
			expect( apiFetch ).toHaveBeenCalledWith(
				expect.objectContaining( { path: expect.stringContaining( 'ai-assistant-feature' ) } )
			);
		} );

		test( 'a broken connection shows the notice and keeps the usage card', async () => {
			window.location.hash = '#/overview';
			window.jetpackAiSettings = { showFeaturesView: true, blogId: 1, isUserConnected: true };
			useConnectionErrorNotice.mockReturnValue( { hasConnectionError: true } );
			mockApiFetch( {} );

			render( <App /> );

			await expect( screen.findByTestId( 'connection-error' ) ).resolves.toBeInTheDocument();
			// The card follows the site's own connection state, not the notice: a
			// registered site with a linked account can still answer for usage.
			await expect( screen.findByText( 'Available requests' ) ).resolves.toBeInTheDocument();
		} );

		test( 'a site with no connected owner: the notice shows beside the usage card', async () => {
			window.location.hash = '#/overview';
			window.jetpackAiSettings = {
				showFeaturesView: true,
				blogId: 1,
				isUserConnected: true,
				isConnected: false,
			};
			mockApiFetch();

			render( <App /> );

			await expect(
				screen.findByText( 'This site is not connected to WordPress.com.', IGNORE_A11Y )
			).resolves.toBeInTheDocument();
		} );

		test( 'the usage card asks nothing of an unlinked account', async () => {
			window.location.hash = '#/overview';
			window.jetpackAiSettings = { showFeaturesView: true, blogId: 1, isUserConnected: false };
			mockApiFetch( { featureGet: enabledSettings() } );

			render( <App /> );
			await expect(
				screen.findByText( 'Your WordPress.com account isn\u2019t connected.', IGNORE_A11Y )
			).resolves.toBeInTheDocument();

			expect( apiFetch ).not.toHaveBeenCalledWith(
				expect.objectContaining( { path: expect.stringContaining( 'ai-assistant-feature' ) } )
			);
		} );

		test( 'page data alone decides the account, before and after the settings call', async () => {
			window.jetpackAiSettings = { showFeaturesView: true, blogId: 1, isUserConnected: false };
			// Never resolves: nothing but page data should be needed.
			apiFetch.mockImplementation( ( { path } = {} ) =>
				path?.includes( 'feature-settings' ) ? new Promise( () => {} ) : Promise.resolve( {} )
			);

			render( <App /> );

			await expect(
				screen.findByText( 'Your WordPress.com account isn\u2019t connected.', IGNORE_A11Y )
			).resolves.toBeInTheDocument();
		} );

		test( 'offline mode: page data reaches the notice and outranks the connection ask', async () => {
			window.jetpackAiSettings = { showFeaturesView: true, blogId: 1, isOfflineMode: true };
			mockApiFetch( { featureGet: { ...enabledSettings(), is_connected: false } } );

			render( <App /> );

			await expect(
				screen.findByText( 'Jetpack AI is not available in Offline Mode.', IGNORE_A11Y )
			).resolves.toBeInTheDocument();
			expect(
				screen.queryByText( 'This site is not connected to WordPress.com.', IGNORE_A11Y )
			).not.toBeInTheDocument();
		} );

		test( 'not connected: one notice, not one per tab', async () => {
			window.jetpackAiSettings = { showFeaturesView: true, blogId: 0 };
			mockApiFetch( { featureGet: { ...enabledSettings(), is_connected: false } } );

			render( <App /> );

			await expect(
				screen.findByRole( 'link', { name: 'Connect Jetpack' } )
			).resolves.toBeInTheDocument();
			// One page-level notice — AiFeatures must not render a second copy.
			expect(
				screen.getAllByText( 'This site is not connected to WordPress.com.', IGNORE_A11Y )
			).toHaveLength( 1 );
		} );

		test( 'not connected: page data without canConnectSite keeps the connect link', async () => {
			window.jetpackAiSettings = { showFeaturesView: true, blogId: 0 };
			mockApiFetch( { featureGet: { ...enabledSettings(), is_connected: false } } );

			render( <App /> );

			await expect(
				screen.findByRole( 'link', { name: 'Connect Jetpack' } )
			).resolves.toBeInTheDocument();
			expect( screen.queryByRole( 'link', { name: /Learn more/ } ) ).not.toBeInTheDocument();
		} );

		test( 'not connected: a user who cannot connect gets the doc, not the link', async () => {
			window.jetpackAiSettings = { showFeaturesView: true, blogId: 0, canConnectSite: false };
			mockApiFetch( { featureGet: { ...enabledSettings(), is_connected: false } } );

			render( <App /> );

			await expect(
				screen.findByRole( 'link', { name: /Learn more/ } )
			).resolves.toBeInTheDocument();
			expect( screen.queryByRole( 'link', { name: 'Connect Jetpack' } ) ).not.toBeInTheDocument();
		} );

		test( 'not connected: the connect ask wins over the master-off notice', async () => {
			mockApiFetch( { featureGet: { ...masterOffSettings(), is_connected: false } } );

			render( <App /> );

			await expect(
				screen.findByText( 'This site is not connected to WordPress.com.', IGNORE_A11Y )
			).resolves.toBeInTheDocument();
			expect( screen.queryByText( MASTER_OFF_TITLE, IGNORE_A11Y ) ).not.toBeInTheDocument();
		} );

		test( 'host off: only the host notice shows', async () => {
			window.jetpackAiSettings = masterOffPage( { hostAllowsAi: false } );
			mockApiFetch( { featureGet: { ...masterOffSettings(), host_allows_ai: false } } );

			render( <App /> );

			await expect(
				screen.findByText( 'Jetpack AI is not available for this site.', IGNORE_A11Y )
			).resolves.toBeInTheDocument();
			expect( screen.queryByText( MASTER_OFF_TITLE, IGNORE_A11Y ) ).not.toBeInTheDocument();
		} );

		test( 'MCP sub-view: neither the notice nor the AI features section shows there', async () => {
			window.jetpackAiSettings = masterOffPage();
			window.location.hash = '#/read';
			mockApiFetch( { featureGet: masterOffSettings(), mcpGet: connectedMcpGet() } );

			render( <App /> );

			await expect(
				screen.findByRole( 'button', { name: 'Jetpack AI' } )
			).resolves.toBeInTheDocument();
			expect( screen.queryByText( MASTER_OFF_TITLE, IGNORE_A11Y ) ).not.toBeInTheDocument();
			expect( screen.queryByRole( 'heading', AI_FEATURES_HEADING ) ).not.toBeInTheDocument();
		} );
	} );

	test( 'AI features section: an unlinked user gets the connect ask and locked switches', async () => {
		window.jetpackAiSettings = { showFeaturesView: true, blogId: 1, isUserConnected: false };
		mockApiFetch( { featureGet: enabledSettings() } );

		render( <App /> );

		await expect(
			screen.findByText( 'Your WordPress.com account isn’t connected.', IGNORE_A11Y )
		).resolves.toBeInTheDocument();
		expect( screen.getByRole( 'link', { name: 'Connect account' } ) ).toHaveAttribute(
			'href',
			'admin.php?page=my-jetpack#/connection'
		);
		// The notice needs no fetch; the switches do, so wait for them.
		await expect(
			screen.findByRole( 'checkbox', { name: /Writing Assistant/ } )
		).resolves.toBeDisabled();
	} );

	test( 'save-confirmation: a successful AI-settings save shows a success snackbar', async () => {
		mockApiFetch( { featurePost: () => Promise.resolve( enabledSettings() ) } );

		renderWithSnackbars();

		const toggle = await screen.findByRole( 'checkbox', { name: /Writing Assistant/ } );
		await userEvent.click( toggle );

		// Save feedback is transient, so it renders through the shared
		// Core SnackbarNotices snackbars (SnackbarList), not a
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

		renderWithSnackbars();

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

		renderWithSnackbars();

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

	test( 'internal-testing flag: the gated Overview tab carries the A12s only badge', async () => {
		window.jetpackAiSettings = { showFeaturesView: true, showA12sBadge: true };
		window.location.hash = '#/overview';
		mockApiFetch();

		render( <App /> );

		await expect( screen.findAllByText( 'A12s only' ) ).resolves.toHaveLength( 1 );
		expect( screen.getByRole( 'tab', { name: /Overview/ } ) ).toHaveTextContent( 'A12s only' );
		expect( screen.getByRole( 'tab', { name: 'Settings' } ) ).not.toHaveTextContent( 'A12s only' );
	} );

	test( 'internal-testing flag: the AI features section carries the badge beside its heading', async () => {
		window.jetpackAiSettings = { showFeaturesView: true, showA12sBadge: true };
		mockApiFetch();

		render( <App /> );

		await expect(
			screen.findByRole( 'checkbox', { name: /Writing Assistant/ } )
		).resolves.toBeInTheDocument();
		// One on the Overview tab, one on the section; none on the MCP tab itself.
		expect( screen.getAllByText( 'A12s only' ) ).toHaveLength( 2 );
		expect( screen.getByRole( 'tab', { name: 'Settings' } ) ).not.toHaveTextContent( 'A12s only' );
		const badge = within( featuresSection() ).getByText( 'A12s only' );
		expect( badge ).toHaveClass( 'jetpack-ai-admin__tab-badge' );
		// Beside the heading, not inside it: the section keeps its plain name.
		const heading = within( featuresSection() ).getByRole( 'heading', AI_FEATURES_HEADING );
		expect( heading ).toHaveTextContent( /^AI features$/ );
		expect( heading ).not.toContainElement( badge );
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

	test( 'MCP view tracking: fires once on the MCP tab and latches per mount', async () => {
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
			window.location.hash = '#/overview';
			window.dispatchEvent( new Event( 'hashchange' ) );
			window.location.hash = '#/mcp';
			window.dispatchEvent( new Event( 'hashchange' ) );
		} );

		await waitFor( () => expect( mcpViewCount() ).toBe( 1 ) );
	} );

	describe( 'MCP view: connect card', () => {
		const CONNECT_CARD_TEXT = 'A user connection lets agents securely act on your behalf.';
		const UPSELL_CTA = 'Upgrade plan';

		// Behind the host gate the MCP view is exactly trunk's: with the gate on,
		// the page notice stands in for these (see 'MCP view: connection notices').
		beforeEach( () => {
			window.location.hash = '#/mcp';
		} );

		test( 'site connected, no plan: shows the connect card instead of the upsell', async () => {
			window.jetpackAiSettings = { blogId: 1, isUserConnected: false };
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
			window.jetpackAiSettings = { blogId: 1, isUserConnected: false };
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
			window.jetpackAiSettings = { blogId: 1, isUserConnected: false };
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
			window.jetpackAiSettings = { blogId: 1, isUserConnected: true };
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
			window.jetpackAiSettings = { blogId: 1 };
			mockApiFetch( { mcpGet: { has_mcp_access: false, mcp_abilities: {} } } );

			render( <App /> );

			await expect( screen.findByText( UPSELL_CTA ) ).resolves.toBeInTheDocument();
			expect( screen.queryByText( CONNECT_CARD_TEXT, IGNORE_A11Y ) ).not.toBeInTheDocument();
		} );

		test( 'site not connected: the site notice still comes first', async () => {
			// On a disconnected site the settings request could only reject (the
			// proxy has no site ID), so the fetch is skipped and the friendly
			// notice must show instead of that raw error.
			window.jetpackAiSettings = { isUserConnected: false };
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
		expect( screen.getByRole( 'tab', { name: 'Settings' } ) ).toHaveAttribute(
			'aria-selected',
			'true'
		);
		expect( screen.getByRole( 'tab', { name: /Overview/ } ) ).toHaveAttribute(
			'aria-selected',
			'false'
		);
	} );

	test( 'MCP sub-views: clicking the Settings tab returns to the hub', async () => {
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
		await userEvent.click( screen.getByRole( 'tab', { name: 'Settings' } ) );

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
		const eyebrow = await screen.findByRole( 'button', { name: 'Back to Settings' } );
		await userEvent.click( eyebrow );

		// Back on the hub: breadcrumbs and the eyebrow itself are gone.
		await waitFor( () =>
			expect( screen.queryByRole( 'button', { name: 'Jetpack AI' } ) ).not.toBeInTheDocument()
		);
		expect( screen.queryByRole( 'button', { name: 'Back to Settings' } ) ).not.toBeInTheDocument();
		expect( window.location.hash ).toBe( '#/mcp' );

		// The clicked eyebrow unmounted; focus must be restored to the
		// selected tab instead of silently dropping to <body>.
		expect( screen.getByRole( 'tab', { name: 'Settings' } ) ).toHaveFocus();
	} );

	describe( 'sub-view breadcrumb', () => {
		let back;

		beforeEach( () => {
			window.jetpackAiSettings = { showFeaturesView: true, blogId: 1 };
			mockApiFetch( { mcpGet: connectedMcpGet() } );
			back = jest.spyOn( window.history, 'back' );
		} );

		afterEach( () => {
			back.mockRestore();
		} );

		test( 'opened straight from a link, it goes to the parent instead of leaving wp-admin', async () => {
			window.history.replaceState( null, '', '#/mcp/setup' );
			render( <App /> );

			await userEvent.click( await screen.findByRole( 'button', { name: 'Jetpack AI' } ) );

			await waitFor( () =>
				expect(
					screen.queryByRole( 'navigation', { name: 'Breadcrumbs' } )
				).not.toBeInTheDocument()
			);
			expect( back ).not.toHaveBeenCalled();
			expect( window.location.hash ).toBe( '#/mcp' );
			// The clicked link unmounted; focus lands on the selected tab.
			expect( screen.getByRole( 'tab', { name: 'Settings' } ) ).toHaveFocus();
		} );

		test( 'a sub-view opened from Settings lands focus on its name in the breadcrumb', async () => {
			window.history.replaceState( null, '', '#/mcp' );
			render( <App /> );

			await userEvent.click( await screen.findByRole( 'button', { name: /^Read/ } ) );

			// The row that was clicked left with the Settings view.
			const breadcrumbs = await screen.findByRole( 'navigation', { name: 'Breadcrumbs' } );
			await waitFor( () => expect( within( breadcrumbs ).getByText( 'Read' ) ).toHaveFocus() );
		} );

		test( 'reached in-app, it pops the sub-view entry like the browser Back button', async () => {
			window.history.replaceState( null, '', '#/mcp' );
			render( <App /> );

			await userEvent.click( await screen.findByRole( 'button', { name: /^Read/ } ) );
			await userEvent.click( await screen.findByRole( 'button', { name: 'Jetpack AI' } ) );

			expect( back ).toHaveBeenCalledTimes( 1 );
			await waitFor( () => expect( window.location.hash ).toBe( '#/mcp' ) );
			await waitFor( () =>
				expect( screen.getByRole( 'tab', { name: 'Settings' } ) ).toHaveFocus()
			);
			expect( screen.queryByRole( 'navigation', { name: 'Breadcrumbs' } ) ).not.toBeInTheDocument();
		} );
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

		// No AI features section and no tab bar (a single tab renders no tabs at all).
		expect( screen.queryByRole( 'heading', AI_FEATURES_HEADING ) ).not.toBeInTheDocument();
		expect( screen.queryByText( 'Settings' ) ).not.toBeInTheDocument();
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
		expect( screen.queryByRole( 'heading', AI_FEATURES_HEADING ) ).not.toBeInTheDocument();
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
		expect( tabNames() ).toEqual( [ 'Overview', 'Settings' ] );
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

	test( 'activity log row: promises AI agent actions when the page data says the link is filtered', async () => {
		window.jetpackAiSettings = {
			blogId: 1,
			activityLogUrl: 'https://example.com/activity',
			activityLogFiltered: true,
		};
		window.location.hash = '';
		mockApiFetch( { mcpGet: connectedMcpGet() } );

		render( <App /> );

		await expect(
			screen.findByText( 'Review recent actions taken by AI agents on your site.' )
		).resolves.toBeInTheDocument();
	} );

	test( 'activity log row: describes all actions when the page data has no filtered flag', async () => {
		window.jetpackAiSettings = { blogId: 1, activityLogUrl: 'https://example.com/activity' };
		window.location.hash = '';
		mockApiFetch( { mcpGet: connectedMcpGet() } );

		render( <App /> );

		await expect(
			screen.findByText( 'Review recent actions on your site.' )
		).resolves.toBeInTheDocument();
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

	test( 'MCP view tracking: does not fire on the Overview tab', async () => {
		// blogId keeps the settings fetch live so hasMcpAccess resolves; the
		// isMcpContext guard is then the only thing holding the event back.
		window.jetpackAiSettings = { showFeaturesView: true, blogId: 1 };
		mockApiFetch( {
			mcpGet: { has_mcp_access: true, mcp_abilities: { account: { some_tool: {} }, sites: [] } },
		} );

		window.location.hash = '#/overview';
		render( <App /> );

		// Wait for Overview to settle, then confirm no MCP view event.
		await expect( screen.findByText( 'Available requests' ) ).resolves.toBeInTheDocument();
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

describe( 'Discover tab (main.jsx)', () => {
	beforeEach( () => {
		window.jetpackAiSettings = {
			showFeaturesView: true,
			blogId: 1,
			isSelfHosted: true,
			siteAdminUrl: 'https://example.com/wp-admin/',
			featureFlags: { 'ai-hub-discover': true },
		};
		mockApiFetch( { mcpGet: connectedMcpGet() } );
	} );

	afterEach( () => {
		window.history.replaceState( null, '', '/' );
	} );

	const lastDiscoverProps = () => Discover.mock.lastCall[ 0 ];

	// Boot's route, read back from `?p=`.
	const routeSearch = () =>
		new URL( new URL( window.location.href ).searchParams.get( 'p' ) || '/', 'https://x.invalid' )
			.searchParams;
	const PAGE = '/wp-admin/admin.php?page=jetpack-ai';
	const withSkill = ( slug, hash ) =>
		`${ PAGE }&p=${ encodeURIComponent( '/?skill=' + slug ) }${ hash }`;

	test( 'hands Discover no props: it reads what it needs itself', async () => {
		window.history.replaceState( null, '', '#/discover' );
		render( <App /> );

		await expect(
			screen.findByRole( 'heading', { name: 'Skills for your AI agent' } )
		).resolves.toBeInTheDocument();
		expect( lastDiscoverProps() ).toEqual( {} );
	} );

	test( 'stays hidden, and its links fall back, without the flag', async () => {
		delete window.jetpackAiSettings.featureFlags;
		window.history.replaceState( null, '', '#/discover/seo-audit' );
		render( <App /> );

		expect( screen.queryByRole( 'tab', { name: 'Skills' } ) ).not.toBeInTheDocument();
		await waitFor( () =>
			expect( screen.getByRole( 'tab', { name: 'Overview' } ) ).toHaveAttribute(
				'aria-selected',
				'true'
			)
		);
	} );

	test( 'shows as the second tab, right after Overview, with the flag', async () => {
		window.history.replaceState( null, '', '#/discover' );
		render( <App /> );

		expect( tabNames() ).toEqual( [ 'Overview', 'Skills', 'Settings' ] );
		expect( screen.getByRole( 'tab', { name: 'Skills' } ) ).toHaveAttribute(
			'aria-selected',
			'true'
		);
		await expect(
			screen.findByRole( 'heading', { name: 'Skills for your AI agent' } )
		).resolves.toBeInTheDocument();
	} );

	test( 'an old skill page link lands on Discover with that skill’s panel open', async () => {
		window.history.replaceState( null, '', PAGE + '#/discover/seo-audit' );
		const before = window.history.length;
		render( <App /> );

		await expect(
			screen.findByRole( 'heading', { name: 'Skills for your AI agent' } )
		).resolves.toBeInTheDocument();
		expect( screen.getByRole( 'tab', { name: 'Skills' } ) ).toHaveAttribute(
			'aria-selected',
			'true'
		);
		// Replaced, not pushed, so Back leaves as it would have.
		expect( window.location.hash ).toBe( '#/discover' );
		expect( routeSearch().get( 'skill' ) ).toBe( 'seo-audit' );
		expect( window.history ).toHaveLength( before );
		// No skill page any more: the tab bar is the only navigation.
		expect( screen.queryByRole( 'navigation', { name: 'Breadcrumbs' } ) ).not.toBeInTheDocument();
		expect( screen.queryByRole( 'button', { name: 'Back to Skills' } ) ).not.toBeInTheDocument();
	} );

	test( 'another tab closes the panel and keeps the rest of the address', async () => {
		window.history.replaceState( null, '', withSkill( 'seo-audit', '#/discover' ) );
		render( <App /> );

		await userEvent.click( screen.getByRole( 'tab', { name: 'Settings' } ) );

		expect( window.location.hash ).toBe( '#/mcp' );
		expect( routeSearch().has( 'skill' ) ).toBe( false );
		expect( new URL( window.location.href ).searchParams.get( 'page' ) ).toBe( 'jetpack-ai' );
	} );

	// AdminPage's root has no role to find it by, and its attribute is what's under test.
	// eslint-disable-next-line testing-library/no-node-access
	const adminPageRoot = () => document.querySelector( '.jp-admin-page' );

	test( 'below the medium break, the hub behind an open panel is inert until it closes', async () => {
		useViewportMatch.mockImplementation(
			( breakpoint, operator ) => breakpoint === 'medium' && operator === '<'
		);
		try {
			window.history.replaceState( null, '', withSkill( 'seo-audit', '#/discover' ) );
			render( <App /> );
			const root = adminPageRoot();

			await waitFor( () => expect( root ).toHaveAttribute( 'inert' ) );

			await act( async () => closeSkillPanel() );
			expect( root ).not.toHaveAttribute( 'inert' );
		} finally {
			useViewportMatch.mockImplementation( () => false );
		}
	} );

	test( 'beside a panel on a wide screen, the hub stays reachable', async () => {
		window.history.replaceState( null, '', withSkill( 'seo-audit', '#/discover' ) );
		render( <App /> );

		await expect(
			screen.findByRole( 'heading', { name: 'Skills for your AI agent' } )
		).resolves.toBeInTheDocument();
		expect( adminPageRoot() ).not.toHaveAttribute( 'inert' );
	} );

	test( 'a typed hash change leaves the address alone while boot navigates', async () => {
		window.history.replaceState( null, '', withSkill( 'seo-audit', '#/discover' ) );
		render( <App /> );
		await expect(
			screen.findByRole( 'heading', { name: 'Skills for your AI agent' } )
		).resolves.toBeInTheDocument();
		const replaceState = jest.spyOn( window.history, 'replaceState' );

		try {
			await act( async () => {
				window.history.pushState( null, '', withSkill( 'seo-audit', '#/mcp' ) );
				window.dispatchEvent( new Event( 'hashchange' ) );
			} );

			expect( replaceState ).not.toHaveBeenCalled();
			// The gate reads another tab as closed, param or not.
			expect( isSkillPanelOpen( { skill: 'seo-audit' } ) ).toBe( false );
			expect( screen.getByRole( 'tab', { name: 'Settings' } ) ).toHaveAttribute(
				'aria-selected',
				'true'
			);
		} finally {
			replaceState.mockRestore();
		}
	} );

	test( 'an old skill link typed mid-session opens its panel without rewriting the address', async () => {
		window.history.replaceState( null, '', PAGE + '#/overview' );
		render( <App /> );
		await expect(
			screen.findByRole( 'link', { name: 'View skill: Performance audit' } )
		).resolves.toBeInTheDocument();
		const replaceState = jest.spyOn( window.history, 'replaceState' );

		try {
			await act( async () => {
				window.history.pushState( null, '', PAGE + '#/discover/seo-audit' );
				window.dispatchEvent( new Event( 'hashchange' ) );
			} );

			// Boot's router is loading the route here: a replace would start a
			// second navigation and cancel the first's view transition. The old
			// hash reads as open as it is.
			await new Promise( resolve => window.requestAnimationFrame( resolve ) );
			expect( replaceState ).not.toHaveBeenCalled();
			expect( window.location.hash ).toBe( '#/discover/seo-audit' );
			expect( getOpenSkillSlug() ).toBe( 'seo-audit' );
			expect( isSkillPanelOpen( {} ) ).toBe( true );
			expect( screen.getByRole( 'tab', { name: 'Skills' } ) ).toHaveAttribute(
				'aria-selected',
				'true'
			);

			// Closing it lands on Discover with no panel.
			await act( async () => closeSkillPanel() );
			expect( window.location.hash ).toBe( '#/discover' );
			expect( getOpenSkillSlug() ).toBe( '' );
		} finally {
			replaceState.mockRestore();
		}
	} );

	test( 'an Overview card switches to Discover with its panel in one push, and Back returns', async () => {
		window.history.replaceState( null, '', PAGE + '#/overview' );
		render( <App /> );
		const card = await screen.findByRole( 'link', { name: 'View skill: Performance audit' } );
		const pushState = jest.spyOn( window.history, 'pushState' );
		const replaceState = jest.spyOn( window.history, 'replaceState' );

		try {
			await userEvent.click( card );

			await waitFor( () =>
				expect( screen.getByRole( 'tab', { name: 'Skills' } ) ).toHaveAttribute(
					'aria-selected',
					'true'
				)
			);
			expect( routeSearch().get( 'skill' ) ).toBe( 'performance-audit' );
			expect( pushState ).toHaveBeenCalledTimes( 1 );
			expect( replaceState ).not.toHaveBeenCalled();

			const popped = new Promise( resolve =>
				window.addEventListener( 'popstate', resolve, { once: true } )
			);
			await act( async () => {
				window.history.back();
				await popped;
			} );

			await waitFor( () =>
				expect( screen.getByRole( 'tab', { name: 'Overview' } ) ).toHaveAttribute(
					'aria-selected',
					'true'
				)
			);
			expect( routeSearch().has( 'skill' ) ).toBe( false );
		} finally {
			pushState.mockRestore();
			replaceState.mockRestore();
		}
	} );

	test( 'a panel left in the address of another tab is dropped', async () => {
		window.history.replaceState( null, '', withSkill( 'seo-audit', '#/mcp' ) );
		render( <App /> );

		await waitFor( () => expect( routeSearch().has( 'skill' ) ).toBe( false ) );
		expect( window.location.hash ).toBe( '#/mcp' );
	} );

	test.each( [ 'not-a-skill', 'set-up-a-staging-site' ] )(
		'a link to a skill this site cannot run (%s) falls back to the first tab',
		async slug => {
			window.history.replaceState( null, '', PAGE + '#/discover/' + slug );
			render( <App /> );

			await waitFor( () =>
				expect( screen.getByRole( 'tab', { name: 'Overview' } ) ).toHaveAttribute(
					'aria-selected',
					'true'
				)
			);
			expect( routeSearch().has( 'skill' ) ).toBe( false );
		}
	);

	test.each( [ 'not-a-skill', 'set-up-a-staging-site' ] )(
		'a panel for a skill this site cannot run (%s) opens nothing and leaves the address',
		async slug => {
			window.history.replaceState( null, '', withSkill( slug, '#/discover' ) );
			render( <App /> );

			await waitFor( () => expect( routeSearch().has( 'skill' ) ).toBe( false ) );
			expect( window.location.hash ).toBe( '#/discover' );
		}
	);
} );

describe( 'Tab order (main.jsx)', () => {
	test.each( [
		[ 'no flags', {}, [ 'Overview', 'Settings' ] ],
		[ 'Discover', { 'ai-hub-discover': true }, [ 'Overview', 'Skills', 'Settings' ] ],
		[
			'Scheduled tasks',
			{ 'ai-hub-scheduled-tasks': true },
			[ 'Overview', 'Settings', 'Scheduled tasks' ],
		],
		[
			'both flags',
			{ 'ai-hub-discover': true, 'ai-hub-scheduled-tasks': true },
			[ 'Overview', 'Skills', 'Settings', 'Scheduled tasks' ],
		],
	] )( 'with %s: AI Features is no longer a tab', async ( _label, featureFlags, expected ) => {
		window.jetpackAiSettings = { showFeaturesView: true, blogId: 1, featureFlags };
		window.location.hash = '#/overview';
		mockApiFetch( { mcpGet: connectedMcpGet() } );

		render( <App /> );

		await expect( screen.findByText( 'Available requests' ) ).resolves.toBeInTheDocument();
		expect( tabNames() ).toEqual( expected );
	} );

	test( 'behind the host gate, Discover leads the bar but MCP stays the landing view', async () => {
		window.jetpackAiSettings = { blogId: 1, featureFlags: { 'ai-hub-discover': true } };
		window.location.hash = '';
		mockApiFetch( { mcpGet: connectedMcpGet() } );

		render( <App /> );

		await expect(
			screen.findByRole( 'checkbox', { name: 'Enable MCP access' } )
		).resolves.toBeInTheDocument();
		expect( tabNames() ).toEqual( [ 'Skills', 'Settings' ] );
		expect( screen.getByRole( 'tab', { name: 'Settings' } ) ).toHaveAttribute(
			'aria-selected',
			'true'
		);
	} );
} );

describe( 'AI features section (main.jsx)', () => {
	let scrollIntoView;

	beforeEach( () => {
		// jsdom implements no scrolling; stub the one call the #/features alias makes.
		scrollIntoView = jest.fn();
		Element.prototype.scrollIntoView = scrollIntoView;
	} );

	afterEach( () => {
		delete Element.prototype.scrollIntoView;
	} );

	test( 'sits below the MCP hub with a correct heading outline', async () => {
		window.jetpackAiSettings = { showFeaturesView: true, blogId: 1 };
		mockApiFetch( {
			mcpGet: connectedMcpGet(),
			featureGet: {
				...enabledSettings(),
				features: { writing_assistant: { enabled: true }, image_editor: { enabled: true } },
			},
		} );

		render( <App /> );

		await expect(
			screen.findByRole( 'checkbox', { name: 'Enable MCP access' } )
		).resolves.toBeInTheDocument();
		await expect(
			screen.findByRole( 'checkbox', { name: /Writing Assistant/ } )
		).resolves.toBeInTheDocument();

		const section = featuresSection();
		expect( section ).toHaveAttribute( 'id', 'jetpack-ai-features' );
		expect( within( section ).getByRole( 'heading', AI_FEATURES_HEADING ) ).toBeInTheDocument();
		// The groups sit one level under the section's h2.
		expect(
			within( section )
				.getAllByRole( 'heading', { level: 3 } )
				.map( heading => heading.textContent )
		).toEqual( [ 'Content', 'Media' ] );
		// MCP content comes first; the section never scrolls without the old hash.
		const [ first ] = screen.getAllByText( /^(External AI agent access|AI features)$/ );
		expect( first ).toHaveTextContent( 'External AI agent access' );
		expect( scrollIntoView ).not.toHaveBeenCalled();
	} );

	test( 'an old #/features link lands on MCP and scrolls to the section', async () => {
		window.jetpackAiSettings = { showFeaturesView: true, blogId: 1 };
		window.location.hash = '#/features';
		mockApiFetch( { mcpGet: connectedMcpGet() } );

		render( <App /> );

		await expect(
			screen.findByRole( 'checkbox', { name: /Writing Assistant/ } )
		).resolves.toBeInTheDocument();
		expect( screen.getByRole( 'tab', { name: 'Settings' } ) ).toHaveAttribute(
			'aria-selected',
			'true'
		);
		expect( screen.getByRole( 'checkbox', { name: 'Enable MCP access' } ) ).toBeInTheDocument();
		await waitFor( () => expect( scrollIntoView ).toHaveBeenCalledTimes( 1 ) );
		expect( scrollIntoView.mock.contexts[ 0 ] ).toBe( featuresSection() );
	} );

	test( 'an old #/features link moves focus to the section heading, without scrolling again', async () => {
		window.jetpackAiSettings = { showFeaturesView: true, blogId: 1 };
		window.location.hash = '#/features';
		mockApiFetch( { mcpGet: connectedMcpGet() } );
		const focus = jest.spyOn( HTMLElement.prototype, 'focus' );

		try {
			render( <App /> );

			await waitFor( () => expect( scrollIntoView ).toHaveBeenCalledTimes( 1 ) );
			const heading = within( featuresSection() ).getByRole( 'heading', AI_FEATURES_HEADING );
			expect( heading ).toHaveFocus();
			expect( heading ).toHaveAttribute( 'tabindex', '-1' );
			expect( focus.mock.contexts ).toContain( heading );
			expect( focus.mock.calls[ focus.mock.contexts.indexOf( heading ) ] ).toEqual( [
				{ preventScroll: true },
			] );
		} finally {
			focus.mockRestore();
		}
	} );

	test( 'a plain click on the MCP tab neither scrolls nor moves focus to the section', async () => {
		window.jetpackAiSettings = { showFeaturesView: true, blogId: 1 };
		window.location.hash = '#/overview';
		mockApiFetch( { mcpGet: connectedMcpGet() } );

		render( <App /> );

		const tab = screen.getByRole( 'tab', { name: 'Settings' } );
		await userEvent.click( tab );
		await expect(
			screen.findByRole( 'checkbox', { name: /Writing Assistant/ } )
		).resolves.toBeInTheDocument();
		expect( scrollIntoView ).not.toHaveBeenCalled();
		expect( tab ).toHaveFocus();
		expect( screen.getByRole( 'heading', AI_FEATURES_HEADING ) ).not.toHaveFocus();
	} );

	test( 'leaving an old #/features link before the loads settle drops the scroll', async () => {
		window.jetpackAiSettings = { showFeaturesView: true, blogId: 1 };
		window.location.hash = '#/features';
		let resolveMcp;
		apiFetch.mockImplementation( ( { path } = {} ) => {
			if ( path?.includes( 'mcp-settings' ) ) {
				return new Promise( resolve => {
					resolveMcp = resolve;
				} );
			}
			return Promise.resolve( path?.includes( 'feature-settings' ) ? enabledSettings() : {} );
		} );

		render( <App /> );

		// The MCP request is still out, so the scroll is still waiting.
		await expect(
			screen.findByRole( 'checkbox', { name: /Writing Assistant/ } )
		).resolves.toBeInTheDocument();
		await userEvent.click( screen.getByRole( 'tab', { name: 'Overview' } ) );
		await act( async () => resolveMcp( connectedMcpGet() ) );
		await userEvent.click( screen.getByRole( 'tab', { name: 'Settings' } ) );

		await expect(
			screen.findByRole( 'checkbox', { name: 'Enable MCP access' } )
		).resolves.toBeInTheDocument();
		expect( scrollIntoView ).not.toHaveBeenCalled();
		expect( screen.getByRole( 'heading', AI_FEATURES_HEADING ) ).not.toHaveFocus();
	} );

	test( 'a #/features link followed from the MCP view scrolls again', async () => {
		window.jetpackAiSettings = { showFeaturesView: true, blogId: 1 };
		mockApiFetch( { mcpGet: connectedMcpGet() } );

		render( <App /> );

		await expect(
			screen.findByRole( 'checkbox', { name: /Writing Assistant/ } )
		).resolves.toBeInTheDocument();
		expect( scrollIntoView ).not.toHaveBeenCalled();

		act( () => {
			window.location.hash = '#/features';
			window.dispatchEvent( new Event( 'hashchange' ) );
		} );

		await waitFor( () => expect( scrollIntoView ).toHaveBeenCalledTimes( 1 ) );
	} );

	test.each( [
		[
			'the upsell',
			{ blogId: 1 },
			() => mockApiFetch( { mcpGet: { has_mcp_access: false, mcp_abilities: {} } } ),
			() => screen.findByText( 'Upgrade plan' ),
		],
		// With the gate on, the page notice stands in for MCP's connection asks.
		[
			'the account notice',
			{ blogId: 1, isUserConnected: false },
			() => mockApiFetch(),
			() => screen.findByText( 'Your WordPress.com account isn’t connected.', IGNORE_A11Y ),
		],
		[
			'the site notice',
			{},
			() => mockApiFetch(),
			() => screen.findByText( 'This site is not connected to WordPress.com.', IGNORE_A11Y ),
		],
		[
			'a load error',
			{ blogId: 1 },
			() =>
				apiFetch.mockImplementation( ( { path } = {} ) =>
					path?.includes( 'mcp-settings' )
						? Promise.reject( new Error( 'Something went wrong.' ) )
						: Promise.resolve( enabledSettings() )
				),
			() => screen.findByText( 'Something went wrong.', IGNORE_A11Y ),
		],
		[
			'the spinner',
			{ blogId: 1 },
			// The MCP request never settles, so its spinner stays.
			() =>
				apiFetch.mockImplementation( ( { path } = {} ) =>
					path?.includes( 'mcp-settings' )
						? new Promise( () => {} )
						: Promise.resolve( enabledSettings() )
				),
			() => screen.findAllByRole( 'status' ),
		],
	] )( 'renders while MCP shows %s', async ( _label, pageData, mockRequests, findMcpState ) => {
		window.jetpackAiSettings = { showFeaturesView: true, ...pageData };
		mockRequests();

		render( <App /> );

		await findMcpState();
		await expect(
			screen.findByRole( 'checkbox', { name: /Writing Assistant/ } )
		).resolves.toBeInTheDocument();
		expect( screen.getByRole( 'heading', AI_FEATURES_HEADING ) ).toBeInTheDocument();
		// The MCP state holds beside it: the hub itself never rendered.
		await findMcpState();
		expect(
			screen.queryByRole( 'checkbox', { name: 'Enable MCP access' } )
		).not.toBeInTheDocument();
	} );

	test( 'shows its own spinner while the feature settings load', async () => {
		window.jetpackAiSettings = { showFeaturesView: true, blogId: 1 };
		apiFetch.mockImplementation( ( { path } = {} ) => {
			if ( path?.includes( 'feature-settings' ) ) {
				return new Promise( () => {} );
			}
			return Promise.resolve( path?.includes( 'mcp-settings' ) ? connectedMcpGet() : {} );
		} );

		render( <App /> );

		await expect(
			screen.findByRole( 'checkbox', { name: 'Enable MCP access' } )
		).resolves.toBeInTheDocument();
		const section = featuresSection();
		expect( within( section ).getByRole( 'status' ) ).toBeInTheDocument();
		expect( within( section ).queryByRole( 'checkbox' ) ).not.toBeInTheDocument();
	} );

	test( 'a feature settings load error stays inside the section', async () => {
		window.jetpackAiSettings = { showFeaturesView: true, blogId: 1 };
		apiFetch.mockImplementation( ( { path } = {} ) => {
			if ( path?.includes( 'feature-settings' ) ) {
				return Promise.reject( new Error( 'Feature settings failed.' ) );
			}
			return Promise.resolve( path?.includes( 'mcp-settings' ) ? connectedMcpGet() : {} );
		} );

		render( <App /> );

		await expect(
			screen.findByRole( 'checkbox', { name: 'Enable MCP access' } )
		).resolves.toBeEnabled();
		await expect(
			within( featuresSection() ).findByText( 'Feature settings failed.' )
		).resolves.toBeInTheDocument();
	} );

	test.each( [ '#/mcp', '#/features' ] )(
		'behind the host gate there is no AI features section, with hash %s',
		async hash => {
			window.jetpackAiSettings = { blogId: 1 };
			window.location.hash = hash;
			mockApiFetch( { mcpGet: connectedMcpGet() } );

			render( <App /> );

			await expect(
				screen.findByRole( 'checkbox', { name: 'Enable MCP access' } )
			).resolves.toBeInTheDocument();
			expect( screen.queryByRole( 'heading', AI_FEATURES_HEADING ) ).not.toBeInTheDocument();
			expect(
				screen.queryByRole( 'checkbox', { name: /Writing Assistant/ } )
			).not.toBeInTheDocument();
			// Gated off, the settings are never asked for.
			expect( apiFetch ).not.toHaveBeenCalledWith(
				expect.objectContaining( { path: expect.stringContaining( 'feature-settings' ) } )
			);
			expect( scrollIntoView ).not.toHaveBeenCalled();
		}
	);
} );

describe( 'MCP view: connection notices (main.jsx)', () => {
	const OFFLINE = 'Jetpack AI is not available in offline mode.';
	const SITE = 'This site is not connected to WordPress.com.';
	const ACCOUNT = 'Your WordPress.com account isn’t connected.';
	const CALLOUT = 'A user connection lets agents securely act on your behalf.';
	// Every way the view can ask for the site's or account's connection: the
	// page notice's links and MCP's own callout button, which renders as a link.
	// The agent buttons install a connector in the agent, so they aren't asks.
	const connectAsks = () =>
		screen
			.queryAllByRole( 'link', { name: /^Connect/ } )
			.filter( link => ! /^Connect (Claude|ChatGPT)/.test( link.textContent ) );
	const agentButtons = () => screen.queryAllByRole( 'link', { name: /^Connect (Claude|ChatGPT)/ } );
	// Document order: b follows a, outside it.
	const precedes = ( a, b ) => a.compareDocumentPosition( b ) === Node.DOCUMENT_POSITION_FOLLOWING;

	beforeEach( () => {
		window.location.hash = '#/mcp';
	} );

	test.each( [
		[ 'offline mode, no site', { isOfflineMode: true }, OFFLINE, 0 ],
		[
			'offline mode, unlinked account',
			{ isOfflineMode: true, blogId: 1, isUserConnected: false },
			OFFLINE,
			0,
		],
		[ 'no site', {}, SITE, 1 ],
		[
			'no connection owner, unlinked account',
			{ blogId: 1, isConnected: false, isUserConnected: false },
			SITE,
			1,
		],
		[ 'unlinked account', { blogId: 1, isUserConnected: false }, ACCOUNT, 1 ],
	] )(
		'%s: one notice at the top of the view, in place of MCP’s own',
		async ( _label, pageData, title, asks ) => {
			window.jetpackAiSettings = { showFeaturesView: true, ...pageData };
			mockApiFetch();

			render( <App /> );

			await expect(
				screen.findByRole( 'checkbox', { name: /Writing Assistant/ } )
			).resolves.toBeInTheDocument();
			expect( screen.getAllByText( title, IGNORE_A11Y ) ).toHaveLength( 1 );
			expect( connectAsks() ).toHaveLength( asks );
			// The agent buttons live on Overview whenever that tab exists.
			expect( agentButtons() ).toHaveLength( 0 );
			expect( screen.queryByText( MCP_NOT_CONNECTED, IGNORE_A11Y ) ).not.toBeInTheDocument();
			expect( screen.queryByText( CALLOUT, IGNORE_A11Y ) ).not.toBeInTheDocument();
			// It heads the view; the AI features section carries no copy of it.
			expect( within( featuresSection() ).queryByText( title ) ).not.toBeInTheDocument();
			expect(
				precedes(
					screen.getByText( title, IGNORE_A11Y ),
					screen.getByRole( 'heading', AI_FEATURES_HEADING )
				)
			).toBe( true );
		}
	);

	test.each( [
		[ 'offline mode', { isOfflineMode: true }, OFFLINE ],
		[ 'a site with no connection owner', { isConnected: false }, SITE ],
	] )(
		'%s with a linked account: the MCP hub still renders under the notice',
		async ( _label, pageData, title ) => {
			window.jetpackAiSettings = { showFeaturesView: true, blogId: 1, ...pageData };
			mockApiFetch( { mcpGet: connectedMcpGet() } );

			render( <App /> );

			await expect(
				screen.findByRole( 'checkbox', { name: 'Enable MCP access' } )
			).resolves.toBeInTheDocument();
			expect( screen.getAllByText( title, IGNORE_A11Y ) ).toHaveLength( 1 );
			expect(
				precedes(
					screen.getByText( title, IGNORE_A11Y ),
					screen.getByText( 'External AI agent access' )
				)
			).toBe( true );
		}
	);

	test( 'offline mode without an MCP plan: the upsell still renders', async () => {
		window.jetpackAiSettings = { showFeaturesView: true, blogId: 1, isOfflineMode: true };
		mockApiFetch( { mcpGet: { has_mcp_access: false, mcp_abilities: {} } } );

		render( <App /> );

		await expect( screen.findByText( 'Upgrade plan' ) ).resolves.toBeInTheDocument();
		expect( screen.getAllByText( OFFLINE, IGNORE_A11Y ) ).toHaveLength( 1 );
	} );

	test.each( [
		[ 'host off', { hostAllowsAi: false }, 'Jetpack AI is not available for this site.' ],
		[
			'custom code',
			{ masterForcedOff: 'filter' },
			'Jetpack AI is turned off by custom code on this site.',
		],
		[ 'the master switch', { masterEnabled: false }, 'Jetpack AI is turned off for this site.' ],
	] )( '%s: the notice stays inside the AI features section', async ( _label, pageData, title ) => {
		window.jetpackAiSettings = { showFeaturesView: true, blogId: 1, ...pageData };
		mockApiFetch( { mcpGet: connectedMcpGet() } );

		render( <App /> );

		await expect(
			screen.findByRole( 'checkbox', { name: 'Enable MCP access' } )
		).resolves.toBeInTheDocument();
		await expect( within( featuresSection() ).findByText( title ) ).resolves.toBeInTheDocument();
		expect( screen.getAllByText( title, IGNORE_A11Y ) ).toHaveLength( 1 );
	} );

	test( 'a broken connection: the shared notice stays inside the AI features section', async () => {
		window.jetpackAiSettings = { showFeaturesView: true, blogId: 1 };
		useConnectionErrorNotice.mockReturnValue( { hasConnectionError: true } );
		mockApiFetch( { mcpGet: connectedMcpGet() } );

		render( <App /> );

		await expect(
			screen.findByRole( 'checkbox', { name: 'Enable MCP access' } )
		).resolves.toBeInTheDocument();
		expect( screen.getAllByTestId( 'connection-error' ) ).toHaveLength( 1 );
		expect( within( featuresSection() ).getByTestId( 'connection-error' ) ).toBeInTheDocument();
	} );

	test.each( [
		[ 'no site', {}, MCP_NOT_CONNECTED ],
		[ 'an unlinked account', { blogId: 1, isUserConnected: false }, CALLOUT ],
	] )(
		'behind the host gate, %s keeps MCP’s own ask and no page notice',
		async ( _label, pageData, text ) => {
			window.jetpackAiSettings = { ...pageData };
			mockApiFetch();

			render( <App /> );

			await expect( screen.findByText( text, IGNORE_A11Y ) ).resolves.toBeInTheDocument();
			expect( screen.queryByText( SITE, IGNORE_A11Y ) ).not.toBeInTheDocument();
			expect( screen.queryByText( ACCOUNT, IGNORE_A11Y ) ).not.toBeInTheDocument();
			expect( connectAsks().length ).toBeLessThanOrEqual( 1 );
		}
	);
} );

describe( 'Settings tab (main.jsx)', () => {
	beforeEach( () => {
		window.jetpackAiSettings = { showFeaturesView: true, blogId: 1 };
		mockApiFetch( {
			mcpGet: connectedMcpGet(),
			featureGet: {
				...enabledSettings(),
				features: { writing_assistant: { enabled: true }, image_editor: { enabled: true } },
			},
		} );
	} );

	afterEach( () => {
		window.history.replaceState( null, '', '/' );
	} );

	const CONNECT_HEADING = { name: 'Connect your AI agent', level: 2 };

	test( 'the tab is named Settings and keeps its #/mcp address', async () => {
		render( <App /> );

		const tab = await screen.findByRole( 'tab', { name: 'Settings' } );
		expect( tab ).toHaveAttribute( 'aria-selected', 'true' );
		expect( screen.queryByRole( 'tab', { name: /MCP and Connectors/ } ) ).not.toBeInTheDocument();
	} );

	test( 'a #/settings link lands on the Settings tab', async () => {
		window.location.hash = '#/settings';
		render( <App /> );

		await expect(
			screen.findByRole( 'heading', { name: 'How it works', level: 2 } )
		).resolves.toBeInTheDocument();
		expect( screen.getByRole( 'tab', { name: 'Settings' } ) ).toHaveAttribute(
			'aria-selected',
			'true'
		);
	} );

	test( 'leaves the connect card to Overview, under a clean h2/h3 outline', async () => {
		render( <App /> );

		await expect(
			screen.findByRole( 'checkbox', { name: /Writing Assistant/ } )
		).resolves.toBeInTheDocument();

		// The page title is the only h1; every section is an h2, and only the
		// explainer's steps and the feature groups sit a level under one.
		expect( screen.queryAllByRole( 'heading', { level: 1 } ).length ).toBeLessThanOrEqual( 1 );
		expect(
			screen.getAllByRole( 'heading', { level: 2 } ).map( heading => heading.textContent )
		).toEqual( [ 'How it works', 'External AI agent access', 'AI features' ] );
		expect( screen.queryAllByRole( 'heading', { level: 4 } ) ).toHaveLength( 0 );
	} );

	test( 'Overview’s Other agents opens the setup sub-view, with the way back named Settings', async () => {
		window.location.hash = '#/overview';
		render( <App /> );

		await userEvent.click( await screen.findByRole( 'link', { name: 'Other agents' } ) );

		await expect(
			screen.findByRole( 'button', { name: 'Back to Settings' } )
		).resolves.toBeInTheDocument();
		expect( window.location.hash ).toBe( '#/mcp/setup' );
		expect( screen.queryByRole( 'heading', CONNECT_HEADING ) ).not.toBeInTheDocument();
		expect( analytics.tracks.recordEvent ).toHaveBeenCalledWith(
			'jetpack_ai_hub_link_click',
			expect.objectContaining( { link_type: 'overview_connect', link: 'other' } )
		);
	} );

	test.each( [
		[ 'offline mode', { isOfflineMode: true }, 'Jetpack AI is not available in offline mode.' ],
		[
			'a site with no connection owner',
			{ isConnected: false },
			'This site is not connected to WordPress.com.',
		],
	] )(
		'%s: Overview still shows the connect card, under the connection notice',
		async ( _label, pageData, title ) => {
			Object.assign( window.jetpackAiSettings, pageData );
			window.location.hash = '#/overview';
			render( <App /> );

			const heading = await screen.findByRole( 'heading', CONNECT_HEADING );
			expect( screen.getAllByText( title, IGNORE_A11Y ) ).toHaveLength( 1 );
			// The notice comes first in document order.
			expect( screen.getByText( title, IGNORE_A11Y ).compareDocumentPosition( heading ) ).toBe(
				Node.DOCUMENT_POSITION_FOLLOWING
			);
			expect( screen.getAllByRole( 'link', { name: /^Connect Claude/ } ) ).toHaveLength( 1 );
		}
	);

	test( 'behind the host gate the MCP-only page still leads with the connect card', async () => {
		window.jetpackAiSettings = { blogId: 1 };
		window.location.hash = '';
		render( <App /> );

		await expect( screen.findByRole( 'heading', CONNECT_HEADING ) ).resolves.toBeInTheDocument();
		expect( screen.queryByRole( 'tab' ) ).not.toBeInTheDocument();
	} );
} );
