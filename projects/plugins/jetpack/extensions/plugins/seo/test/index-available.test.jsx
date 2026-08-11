import { render, screen } from '@testing-library/react';
// `isSeoEnhancerEnabled` is a module-level constant in index.jsx, computed
// once at import time from `getJetpackExtensionAvailability( 'ai-seo-enhancer' )`.
// To pin behaviour for a fixed availability value without `jest.resetModules()`
// (which reloads React itself and trips React's hooks dispatcher — see the
// sibling `index-withheld.test.jsx` file for the same note), this file mocks
// availability as permanently `true` and does a single top-level import of
// `../index`, matching normal Jest/ESM module semantics.
jest.mock( '@automattic/jetpack-publicize/link-preview', () => ( {
	LinkPreviewModalWithTrigger: () => <div data-testid="link-preview" />,
} ) );
jest.mock( '@automattic/jetpack-script-data', () => ( {
	isWpcomPlatformSite: () => false,
	isSimpleSite: () => false,
} ) );
jest.mock( '@automattic/jetpack-shared-extension-utils', () => ( {
	useModuleStatus: () => ( {
		isLoadingModules: false,
		isChangingStatus: false,
		isModuleActive: true,
		changeStatus: jest.fn(),
	} ),
	getJetpackExtensionAvailability: () => ( { available: true } ),
	getRequiredPlan: () => false,
} ) );
jest.mock( '@automattic/jetpack-shared-extension-utils/components', () => ( {
	JetpackEditorPanelLogo: () => null,
} ) );
jest.mock( '@wordpress/components', () => ( {
	PanelBody: ( { children } ) => <div>{ children }</div>,
	PanelRow: ( { children } ) => <div>{ children }</div>,
} ) );
jest.mock( '@wordpress/core-data', () => ( { store: 'core' } ) );
const mockStore = {
	isPublishSidebarOpened: () => false,
	getCurrentPostType: () => 'post',
	getPostType: () => ( { viewable: true } ),
};
jest.mock( '@wordpress/data', () => ( {
	useSelect: selector => selector( () => mockStore ),
	useDispatch: () => ( { closePublishSidebar: jest.fn() } ),
	select: () => mockStore,
} ) );
jest.mock( '@wordpress/editor', () => ( {
	PluginDocumentSettingPanel: ( { children } ) => <div>{ children }</div>,
	PluginPrePublishPanel: ( { children } ) => <div>{ children }</div>,
	PluginPostPublishPanel: ( { children } ) => <div>{ children }</div>,
	store: 'core/editor',
} ) );
// NOTE: paths are relative to THIS test file (one level deeper than index.jsx).
jest.mock( '../../../shared/jetpack-plugin-sidebar', () => ( { children } ) => (
	<div>{ children }</div>
) );
jest.mock( '../../ai-assistant-plugin/components/seo-enhancer', () => ( {
	SeoEnhancer: () => <div data-testid="seo-enhancer" />,
} ) );
jest.mock( '../../ai-assistant-plugin/components/seo-enhancer/seo-summary', () => ( {
	SeoSummary: () => <div data-testid="seo-summary" />,
} ) );
jest.mock( '../../ai-assistant-plugin/components/seo-enhancer/use-seo-module-settings', () => ( {
	useSeoModuleSettings: () => ( { isEnabled: false, isToggling: false } ),
} ) );
jest.mock( '../../ai-assistant-plugin/components/seo-enhancer/use-seo-requests', () => ( {
	useSeoRequests: () => ( { updateSeoData: jest.fn(), isBusy: false } ),
} ) );
jest.mock( '../components/placeholder', () => ( {
	SeoPlaceholder: () => null,
} ) );
jest.mock( '../components/skeleton-loader', () => ( {
	SeoSkeletonLoader: () => null,
} ) );
jest.mock( '../components/upsell', () => () => null );
jest.mock( '../description-panel', () => () => <div data-testid="seo-description-panel" /> );
jest.mock( '../noindex-panel', () => () => null );
jest.mock( '../schema-panel', () => () => null );
jest.mock( '../title-panel', () => () => <div data-testid="seo-title-panel" /> );
jest.mock( '../show-seo-section', () => ( { showSeoSection: jest.fn() } ) );
// A plain `require()` here (rather than a top-level `import`) so it runs
// AFTER `mockStore` above is initialized: ES imports are hoisted above
// regular statements, and index.jsx reads `mockStore` synchronously at
// module-evaluation time (via `globalSelect( editorStore )`), so a hoisted
// import would hit it in its temporal dead zone.
const { settings } = require( '../index' );

describe( 'Seo panel when ai-seo-enhancer is available', () => {
	test( 'the enhancer renders in all three placements plus the post-publish summary', () => {
		render( settings.render() );

		expect( screen.getAllByTestId( 'seo-enhancer' ) ).toHaveLength( 3 );
		expect( screen.getByTestId( 'seo-summary' ) ).toBeInTheDocument();
	} );
} );
