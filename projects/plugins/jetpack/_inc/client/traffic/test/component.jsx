/**
 * The enhancer row must name whichever switch is actually blocking it.
 * Renders the real connected SEO card over the real root reducer.
 */
import { jest } from '@jest/globals';
import { render as rtlRender, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { createStore, applyMiddleware } from 'redux';
import { thunk } from 'redux-thunk';
import rootReducer from 'state/reducer';
import ConnectedSeo from '../seo';

jest.mock( '@automattic/jetpack-api', () => ( {
	__esModule: true,
	default: new Proxy( {}, { get: () => () => Promise.resolve( {} ) } ),
} ) );

jest.mock( 'lib/analytics', () => ( {
	__esModule: true,
	default: { tracks: { recordEvent: () => {} }, setMcAnalyticsEnabled: () => {} },
} ) );

const AI_OFF_MESSAGE = /Jetpack AI is turned off for this site/;
const AI_SEO_OFF_MESSAGE = /AI SEO is turned off for this site/;

/**
 * The enhancer toggle carries no associated label, so find it by id.
 *
 * @return {HTMLElement} The enhancer toggle input.
 */
function enhancerToggle() {
	return screen.getAllByRole( 'checkbox' ).find( input => input.id === 'seo-enhancer' );
}

/**
 * State for a site that has the enhancer (plan feature + option registered),
 * varying the seo-tools module, Jetpack AI, and the AI SEO feature.
 *
 * @param {object}  _            - Options.
 * @param {boolean} _.seoToolsOn - Whether the seo-tools module is active.
 * @param {boolean} _.aiOn       - Whether Jetpack AI is effectively on.
 * @param {boolean} _.aiSeoOn    - Whether the AI SEO feature is effectively on.
 * @return {object} Initial redux state.
 */
function buildInitialState( { seoToolsOn, aiOn = false, aiSeoOn = false } ) {
	return {
		jetpack: {
			connection: {
				status: {
					siteConnected: {
						isActive: true,
						offlineMode: { isActive: false },
					},
				},
				user: { currentUser: { isConnected: true } },
				requests: {},
			},
			initialState: {
				userData: { currentUser: { permissions: { manage_modules: true } } },
				siteTitle: 'Test Site',
				isAiEnabled: aiOn,
				isAiSeoEnabled: aiSeoOn,
				getModules: {
					'seo-tools': { options: { ai_seo_enhancer_enabled: {} } },
				},
			},
			modules: {
				items: {
					'seo-tools': { module: 'seo-tools', name: 'SEO Tools', activated: seoToolsOn },
				},
			},
			settings: {
				items: {
					'seo-tools': seoToolsOn,
					ai_seo_enhancer_enabled: false,
					advanced_seo_title_formats: {},
					advanced_seo_front_page_description: '',
				},
			},
			siteData: {
				data: {
					name: 'Test Site',
					description: '',
					URL: 'https://example.com',
					site: {
						features: { active: [ 'ai-seo-enhancer', 'advanced-seo' ] },
					},
					plan: { product_slug: 'jetpack_complete' },
				},
			},
		},
	};
}

// The Traffic page passes getModule down to every card (traffic/index.jsx);
// module-scope so the JSX prop reference is stable (react/jsx-no-bind).
let currentModules = {};

/**
 * Look a module up in the current test fixture.
 *
 * @param {string} name - Module slug.
 * @return {object} The module fixture, or an empty object.
 */
function getModule( name ) {
	return currentModules[ name ] || {};
}

/**
 * Render the connected SEO card over the given state.
 *
 * @param {object} initialState - Initial redux state.
 * @return {import('@testing-library/react').RenderResult} Render result.
 */
function renderSeo( initialState ) {
	const store = createStore( rootReducer, initialState, applyMiddleware( thunk ) );
	currentModules = initialState.jetpack.modules.items;
	return rtlRender(
		<Provider store={ store }>
			<ConnectedSeo configureUrl="https://example.com/configure" getModule={ getModule } />
		</Provider>
	);
}

describe( 'SEO card enhancer row explanation', () => {
	it( 'shows the AI-off message while seo-tools is on and AI is off', () => {
		renderSeo( buildInitialState( { seoToolsOn: true } ) );

		expect( screen.getByText( AI_OFF_MESSAGE ) ).toBeInTheDocument();
	} );

	it( 'does not blame AI while the seo-tools module is the blocker', () => {
		renderSeo( buildInitialState( { seoToolsOn: false } ) );

		expect( screen.queryByText( AI_OFF_MESSAGE ) ).not.toBeInTheDocument();
	} );

	it( 'disables the enhancer toggle while the AI SEO feature is off', () => {
		renderSeo( buildInitialState( { seoToolsOn: true, aiOn: true, aiSeoOn: false } ) );

		expect( enhancerToggle() ).toBeDisabled();
	} );

	it( 'names the AI SEO feature, not Jetpack AI, while only the feature is off', () => {
		renderSeo( buildInitialState( { seoToolsOn: true, aiOn: true, aiSeoOn: false } ) );

		expect( screen.getByText( AI_SEO_OFF_MESSAGE ) ).toBeInTheDocument();
		expect( screen.queryByText( AI_OFF_MESSAGE ) ).not.toBeInTheDocument();
	} );

	it( 'leaves the enhancer toggle alone while both AI and the feature are on', () => {
		renderSeo( buildInitialState( { seoToolsOn: true, aiOn: true, aiSeoOn: true } ) );

		expect( enhancerToggle() ).toBeEnabled();
		expect( screen.queryByText( AI_SEO_OFF_MESSAGE ) ).not.toBeInTheDocument();
		expect( screen.queryByText( AI_OFF_MESSAGE ) ).not.toBeInTheDocument();
	} );
} );
