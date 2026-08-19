/**
 * The enhancer row's "Jetpack AI is turned off" explanation must only blame
 * AI while AI is genuinely the blocker: with the seo-tools module off, the
 * toggle is disabled by the module gate and the AI message would mislead.
 * Renders the REAL connected SEO card with the real root reducer.
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

/**
 * State for a site that has the enhancer (plan feature + option registered),
 * with AI effectively off and the seo-tools module on or off.
 *
 * @param {object}  _            - Options.
 * @param {boolean} _.seoToolsOn - Whether the seo-tools module is active.
 * @return {object} Initial redux state.
 */
function buildInitialState( { seoToolsOn } ) {
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
				isAiEnabled: false,
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
} );
