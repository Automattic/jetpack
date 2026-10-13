import { render } from '@testing-library/react';

// jest.isolateModules() would otherwise hand the re-required module its own copy of
// React, which breaks hooks. Pin every registry to one instance.
jest.mock( 'react', () => {
	globalThis.__seoTestReact = globalThis.__seoTestReact || jest.requireActual( 'react' );
	return globalThis.__seoTestReact;
} );

let mockEnhancerAvailable = false;
let mockCanAutoEnhance = true;
let mockIsModuleActive = true;
let mockPublishSidebarOpen = false;
const mockUpdateSeoData = jest.fn();
const mockUseSeoRequests = jest.fn( () => ( {
	updateSeoData: mockUpdateSeoData,
	isBusy: false,
} ) );

jest.mock( '../../ai-assistant-plugin/components/seo-enhancer/use-seo-requests', () => ( {
	useSeoRequests: ( ...args ) => mockUseSeoRequests( ...args ),
} ) );

jest.mock( '../../ai-assistant-plugin/components/seo-enhancer', () => ( {
	SeoEnhancer: () => null,
} ) );
jest.mock( '../../ai-assistant-plugin/components/seo-enhancer/seo-summary', () => ( {
	SeoSummary: () => null,
} ) );
jest.mock( '../../ai-assistant-plugin/components/seo-enhancer/use-seo-module-settings', () => ( {
	useSeoModuleSettings: () => ( { isEnabled: true, isToggling: false } ),
} ) );
jest.mock( '../../ai-assistant-plugin/components/seo-enhancer/can-auto-enhance-metadata', () => ( {
	canAutoEnhanceMetadata: () => mockCanAutoEnhance,
} ) );
jest.mock( '../../ai-assistant-plugin/components/seo-enhancer/is-ai-seo-enabled', () => ( {
	isAiSeoEnabled: () => true,
} ) );

jest.mock( '@automattic/jetpack-shared-extension-utils', () => ( {
	useModuleStatus: () => ( {
		isLoadingModules: false,
		isChangingStatus: false,
		isModuleActive: mockIsModuleActive,
		changeStatus: jest.fn(),
	} ),
	getJetpackExtensionAvailability: feature =>
		feature === 'ai-seo-enhancer' ? { available: mockEnhancerAvailable } : { available: true },
	getRequiredPlan: () => false,
} ) );
jest.mock( '@automattic/jetpack-shared-extension-utils/components', () => ( {
	JetpackEditorPanelLogo: () => null,
} ) );
jest.mock( '@automattic/jetpack-publicize/link-preview', () => ( {
	LinkPreviewModalWithTrigger: () => null,
} ) );
jest.mock( '@automattic/jetpack-script-data', () => ( { isWpcomPlatformSite: () => false } ) );

jest.mock( '@wordpress/editor', () => ( {
	PluginDocumentSettingPanel: ( { children } ) => children,
	PluginPrePublishPanel: ( { children } ) => children,
	PluginPostPublishPanel: ( { children } ) => children,
	store: 'core/editor',
} ) );
jest.mock( '@wordpress/core-data', () => ( { store: 'core' } ) );

jest.mock( '@wordpress/data', () => {
	const actual = jest.requireActual( '@wordpress/data' );
	const stores = {
		'core/editor': {
			isPublishSidebarOpened: () => mockPublishSidebarOpen,
			getCurrentPostType: () => 'post',
			getCurrentPostId: () => 1,
		},
		core: { getPostType: () => ( { viewable: true } ) },
	};
	const mocks = {
		select: store => stores[ store ] ?? actual.select( store ),
		useSelect: selector => selector( store => stores[ store ] ?? actual.select( store ) ),
		useDispatch: () => ( { editPost: jest.fn(), closePublishSidebar: jest.fn() } ),
	};
	// Keep the real registry so @wordpress/components' own stores still work.
	return new Proxy( actual, {
		get( target, property ) {
			return mocks[ property ] ?? target[ property ];
		},
	} );
} );

jest.mock(
	'../../../shared/jetpack-plugin-sidebar',
	() =>
		( { children } ) =>
			children
);
jest.mock( '../title-panel', () => () => null );
jest.mock( '../description-panel', () => () => null );
jest.mock( '../noindex-panel', () => () => null );
jest.mock( '../schema-panel', () => () => null );
jest.mock( '../components/placeholder', () => ( { SeoPlaceholder: () => null } ) );
jest.mock( '../components/skeleton-loader', () => ( { SeoSkeletonLoader: () => null } ) );
jest.mock( '../components/upsell', () => () => null );
jest.mock( '../show-seo-section', () => ( { showSeoSection: jest.fn() } ) );

// The AI gates are module-scope constants, so the module is re-evaluated per case.
const renderSeo = () => {
	let settings;
	jest.isolateModules( () => {
		settings = require( '../index' ).settings;
	} );
	return { ...render( settings.render() ), settings };
};

describe( 'Seo panel', () => {
	beforeEach( () => {
		mockUseSeoRequests.mockClear();
		mockUpdateSeoData.mockClear();
		mockEnhancerAvailable = false;
		mockCanAutoEnhance = true;
		mockIsModuleActive = true;
		mockPublishSidebarOpen = false;
	} );

	it( 'does not reach the AI feature when the SEO enhancer is unavailable', () => {
		mockEnhancerAvailable = false;

		renderSeo();

		expect( mockUseSeoRequests ).not.toHaveBeenCalled();
	} );

	it( 'does not reach the AI feature where automatic enhancement cannot run', () => {
		mockEnhancerAvailable = true;
		mockCanAutoEnhance = false;

		renderSeo();

		expect( mockUseSeoRequests ).not.toHaveBeenCalled();
	} );

	it( 'reaches the AI feature when automatic enhancement can run', () => {
		mockEnhancerAvailable = true;
		mockCanAutoEnhance = true;

		renderSeo();

		expect( mockUseSeoRequests ).toHaveBeenCalled();
	} );

	// Guards the early-return paths in Seo, which must not gate auto-enhance.
	it( 'still reaches the AI feature while the SEO module is inactive', () => {
		mockEnhancerAvailable = true;
		mockIsModuleActive = false;

		renderSeo();

		expect( mockUseSeoRequests ).toHaveBeenCalled();
	} );

	it( 'generates metadata once when the pre-publish sidebar opens', () => {
		mockEnhancerAvailable = true;
		const { rerender, settings } = renderSeo();
		expect( mockUpdateSeoData ).not.toHaveBeenCalled();

		mockPublishSidebarOpen = true;
		rerender( settings.render() );

		expect( mockUpdateSeoData ).toHaveBeenCalledTimes( 1 );
		expect( mockUpdateSeoData ).toHaveBeenCalledWith( { trigger: 'auto' } );
	} );

	it( 'does not generate metadata again while the sidebar stays open', () => {
		mockEnhancerAvailable = true;
		const { rerender, settings } = renderSeo();
		mockPublishSidebarOpen = true;
		rerender( settings.render() );
		rerender( settings.render() );

		expect( mockUpdateSeoData ).toHaveBeenCalledTimes( 1 );
	} );
} );
