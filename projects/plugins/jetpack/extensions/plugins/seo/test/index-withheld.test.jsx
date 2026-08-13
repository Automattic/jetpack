import { render, screen } from '@testing-library/react';
// Separate file instead of jest.resetModules(): resetting reloads React, so a
// fresh require of index.jsx crashes the hooks dispatcher against the old RTL
// binding — and re-requiring RTL trips jest-circus's late-hook registration.
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
	getJetpackExtensionAvailability: () => ( { available: false } ),
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
// Plain require(), not import: ES imports hoist above `mockStore`'s
// initialization, and index.jsx reads it synchronously at module evaluation —
// a hoisted import would hit its temporal dead zone.
const { settings } = require( '../index' );

describe( 'Seo panel when ai-seo-enhancer is withheld', () => {
	test( 'no enhancer surface renders — including the component owning the manual Generate button — while plain SEO panels stay', () => {
		render( settings.render() );

		expect( screen.queryByTestId( 'seo-enhancer' ) ).not.toBeInTheDocument();
		expect( screen.queryByTestId( 'seo-summary' ) ).not.toBeInTheDocument();
		// The non-AI SEO panels are untouched by the gate (3 placements each).
		expect( screen.getAllByTestId( 'seo-title-panel' ).length ).toBeGreaterThan( 0 );
		expect( screen.getAllByTestId( 'seo-description-panel' ).length ).toBeGreaterThan( 0 );
	} );
} );
