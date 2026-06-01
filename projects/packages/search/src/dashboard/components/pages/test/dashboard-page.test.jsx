const mockModuleControl = jest.fn();
const mockReaderChatControl = jest.fn();
const mockSearchSuggestionsControl = jest.fn();
const mockAIAgentAccessControl = jest.fn();
const mockWooCommerceProductSearchControl = jest.fn();
let mockSelectMethods;
let mockDispatchMethods;

jest.mock( '@automattic/jetpack-components', () => ( {
	AdminPage: ( { children } ) => <div>{ children }</div>,
	Button: ( { children, onClick } ) => <button onClick={ onClick }>{ children }</button>,
	Col: ( { children } ) => <div>{ children }</div>,
	Container: ( { children } ) => <div>{ children }</div>,
	getProductCheckoutUrl: jest.fn( () => 'https://example.com/checkout' ),
} ) );

jest.mock( '@automattic/jetpack-connection', () => ( {
	ConnectionError: () => <div data-testid="connection-error" />,
	useConnectionErrorNotice: () => ( { hasConnectionError: false } ),
} ) );

jest.mock( '@wordpress/data', () => ( {
	useDispatch: () => mockDispatchMethods,
	useSelect: callback => callback( () => mockSelectMethods ),
} ) );

jest.mock( 'store', () => ( {
	STORE_ID: 'jetpack-search-plugin',
} ) );

jest.mock( 'components/global-notices', () => () => <div data-testid="notices-list" /> );
jest.mock( 'components/loading', () => () => <div data-testid="loading" /> );
jest.mock( 'components/mocked-search', () => () => <div data-testid="mocked-search" /> );
jest.mock( 'components/ai-answers-tab', () => () => <div data-testid="ai-answers-tab" /> );
jest.mock( 'components/module-control', () => props => {
	mockModuleControl( props );
	return <div data-testid="module-control" />;
} );
jest.mock( 'components/experience-selector', () => () => (
	<div data-testid="experience-selector" />
) );
jest.mock( 'components/reader-chat-control', () => props => {
	mockReaderChatControl( props );
	return <div data-testid="reader-chat-control" />;
} );
jest.mock( 'components/search-suggestions-control', () => props => {
	mockSearchSuggestionsControl( props );
	return <div data-testid="search-suggestions-control" />;
} );
jest.mock( 'components/ai-agent-access-control', () => props => {
	mockAIAgentAccessControl( props );
	return <div data-testid="ai-agent-access-control" />;
} );
jest.mock( 'components/woocommerce-product-search-control', () => props => {
	mockWooCommerceProductSearchControl( props );
	return <div data-testid="woocommerce-product-search-control" />;
} );
jest.mock( 'components/record-meter', () => () => <div data-testid="record-meter" /> );
jest.mock( '../sections/first-run-section', () => () => <div data-testid="first-run-section" /> );
jest.mock( '../sections/overview-section', () => () => <div data-testid="overview-section" /> );

/* eslint-disable testing-library/prefer-user-event */
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DashboardPage from '../dashboard-page';

const DEFAULT_TEST_URL = 'https://example.com/wp-admin/admin.php?page=jetpack-search';

const createSelectMethods = () => ( {
	getAPINonce: jest.fn( () => 'nonce' ),
	getAPIRootUrl: jest.fn( () => 'https://example.com/wp-json/' ),
	getBlogId: jest.fn( () => 123 ),
	getCalypsoSlug: jest.fn( () => 'example.com' ),
	getCurrentPlan: jest.fn( () => null ),
	getCurrentUsage: jest.fn( () => null ),
	getLastIndexedDate: jest.fn( () => '' ),
	getLatestMonthRequests: jest.fn( () => null ),
	getNotices: jest.fn( () => [] ),
	getPostCount: jest.fn( () => 10 ),
	getPostTypeBreakdown: jest.fn( () => ( {} ) ),
	getPostTypes: jest.fn( () => ( {} ) ),
	getReaderChatGuidelinesUrl: jest.fn(
		() => 'https://example.com/wp-admin/options-general.php?page=guidelines-wp-admin'
	),
	getAIAgentAccessGuidelinesUrl: jest.fn(
		() => 'https://example.com/wp-admin/options-general.php?page=guidelines-wp-admin'
	),
	getSearchModuleStatus: jest.fn(),
	getSearchPlanInfo: jest.fn(),
	getSearchStats: jest.fn(),
	getSiteAdminUrl: jest.fn( () => 'https://example.com/wp-admin/' ),
	getActiveThemeStylesheet: jest.fn( () => 'twentytwentyfive' ),
	getSiteTitle: jest.fn( () => 'Example Site' ),
	getTierMaximumRecords: jest.fn( () => 100 ),
	hasStartedResolution: jest.fn( () => true ),
	isFreePlan: jest.fn( () => false ),
	isInstantSearchEnabled: jest.fn( () => true ),
	isInstantSearchPromotionActive: jest.fn( () => false ),
	isModuleEnabled: jest.fn( () => true ),
	isNewPricing202208: jest.fn( () => false ),
	isOverLimit: jest.fn( () => false ),
	isPlanJustUpgraded: jest.fn( () => false ),
	isAIAgentAccessAvailable: jest.fn( () => true ),
	isReaderChatAvailable: jest.fn( () => true ),
	isReaderChatEnabled: jest.fn( () => true ),
	isResolving: jest.fn( () => false ),
	isSearchBlocksEnabled: jest.fn( () => false ),
	isSearchSuggestionsEnabled: jest.fn( () => false ),
	isWooCommerceActive: jest.fn( () => false ),
	isWooCommerceSearchTemplateOverrideEnabled: jest.fn( () => false ),
	isBlockTheme: jest.fn( () => true ),
	getProductSearchTemplateConfig: jest.fn( () => ( {
		enabled: false,
		editorUrl: null,
		postType: null,
		isCustomized: false,
	} ) ),
	getProductOverlayTemplateConfig: jest.fn( () => ( {
		enabled: false,
		editorUrl: null,
		postType: null,
		isCustomized: false,
	} ) ),
	getActiveExperience: jest.fn( () => 'embedded' ),
	isTogglingInstantSearch: jest.fn( () => false ),
	isTogglingModule: jest.fn( () => false ),
	isUpdatingJetpackSettings: jest.fn( () => false ),
	supportsInstantSearch: jest.fn( () => true ),
	supportsOnlyClassicSearch: jest.fn( () => false ),
	supportsSearch: jest.fn( () => true ),
} );

describe( 'DashboardPage', () => {
	beforeEach( () => {
		mockModuleControl.mockClear();
		mockReaderChatControl.mockClear();
		mockSearchSuggestionsControl.mockClear();
		mockAIAgentAccessControl.mockClear();
		mockWooCommerceProductSearchControl.mockClear();
		window.history.replaceState( {}, '', DEFAULT_TEST_URL );
		mockSelectMethods = createSelectMethods();
		mockDispatchMethods = {
			removeNotice: jest.fn(),
			updateJetpackSettings: jest.fn(),
		};
	} );

	test( 'passes Reader Chat and AI Agent Access settings to the Search settings control', () => {
		render( <DashboardPage /> );

		// The settings control lives in the Settings tab, which isn't visible until selected.
		fireEvent.click( screen.getByRole( 'tab', { name: /settings/i } ) );

		expect( screen.getByTestId( 'module-control' ) ).toBeInTheDocument();
		expect( mockModuleControl ).toHaveBeenCalledWith(
			expect.objectContaining( {
				aiAgentAccessGuidelinesUrl:
					'https://example.com/wp-admin/options-general.php?page=guidelines-wp-admin',
				isAIAgentAccessAvailable: true,
				isReaderChatAvailable: true,
				isReaderChatEnabled: true,
				readerChatGuidelinesUrl:
					'https://example.com/wp-admin/options-general.php?page=guidelines-wp-admin',
				updateOptions: mockDispatchMethods.updateJetpackSettings,
			} )
		);
		expect( mockSelectMethods.getAIAgentAccessGuidelinesUrl ).toHaveBeenCalled();
		expect( mockSelectMethods.isAIAgentAccessAvailable ).toHaveBeenCalled();
		expect( mockSelectMethods.getReaderChatGuidelinesUrl ).toHaveBeenCalled();
	} );

	test( 'renders ReaderChatControl and AIAgentAccessControl alongside ExperienceSelector when search blocks is enabled', () => {
		jest.spyOn( mockSelectMethods, 'isSearchBlocksEnabled' ).mockImplementation( () => true );

		render( <DashboardPage /> );
		fireEvent.click( screen.getByRole( 'tab', { name: /settings/i } ) );

		expect( screen.getByTestId( 'experience-selector' ) ).toBeInTheDocument();
		expect( screen.getByTestId( 'reader-chat-control' ) ).toBeInTheDocument();
		expect( screen.getByTestId( 'ai-agent-access-control' ) ).toBeInTheDocument();
		expect( screen.queryByTestId( 'module-control' ) ).not.toBeInTheDocument();
		expect( mockReaderChatControl ).toHaveBeenCalledWith(
			expect.objectContaining( {
				isAvailable: true,
				isEnabled: true,
				isSaving: false,
				guidelinesUrl: 'https://example.com/wp-admin/options-general.php?page=guidelines-wp-admin',
				updateOptions: mockDispatchMethods.updateJetpackSettings,
			} )
		);
		expect( mockAIAgentAccessControl ).toHaveBeenCalledWith(
			expect.objectContaining( {
				className: 'jp-search-ai-agent-access-card',
				isAvailable: true,
				guidelinesUrl: 'https://example.com/wp-admin/options-general.php?page=guidelines-wp-admin',
				showGuidelinesLink: false,
			} )
		);
	} );

	test( 'renders SearchSuggestionsControl below Reader Chat when search blocks is enabled', () => {
		jest.spyOn( mockSelectMethods, 'isSearchBlocksEnabled' ).mockImplementation( () => true );

		render( <DashboardPage /> );
		fireEvent.click( screen.getByRole( 'tab', { name: /settings/i } ) );

		const blocks = screen.getAllByTestId(
			/^(experience-selector|reader-chat-control|search-suggestions-control)$/
		);
		expect( blocks ).toEqual( [
			screen.getByTestId( 'experience-selector' ),
			screen.getByTestId( 'reader-chat-control' ),
			screen.getByTestId( 'search-suggestions-control' ),
		] );
		expect( mockSearchSuggestionsControl ).toHaveBeenCalledWith(
			expect.objectContaining( {
				isEnabled: false,
				isInstantSearchEnabled: true,
				supportsInstantSearch: true,
				isSaving: false,
				isDisabledFromOverLimit: false,
				updateOptions: mockDispatchMethods.updateJetpackSettings,
			} )
		);
	} );

	test( 'does not render the Search Suggestions card when instant search is disabled', () => {
		jest.spyOn( mockSelectMethods, 'isSearchBlocksEnabled' ).mockImplementation( () => true );
		jest.spyOn( mockSelectMethods, 'isInstantSearchEnabled' ).mockImplementation( () => false );

		render( <DashboardPage /> );
		fireEvent.click( screen.getByRole( 'tab', { name: /settings/i } ) );

		expect( screen.queryByTestId( 'search-suggestions-control' ) ).not.toBeInTheDocument();
		expect( mockSearchSuggestionsControl ).not.toHaveBeenCalled();
	} );

	test( 'does not render the Search Suggestions card when the plan does not support instant search', () => {
		jest.spyOn( mockSelectMethods, 'isSearchBlocksEnabled' ).mockImplementation( () => true );
		jest.spyOn( mockSelectMethods, 'supportsInstantSearch' ).mockImplementation( () => false );

		render( <DashboardPage /> );
		fireEvent.click( screen.getByRole( 'tab', { name: /settings/i } ) );

		expect( screen.queryByTestId( 'search-suggestions-control' ) ).not.toBeInTheDocument();
		expect( mockSearchSuggestionsControl ).not.toHaveBeenCalled();
	} );

	test( 'renders WooCommerceProductSearchControl when WooCommerce is active and the experience is Embedded', () => {
		jest.spyOn( mockSelectMethods, 'isSearchBlocksEnabled' ).mockImplementation( () => true );
		jest.spyOn( mockSelectMethods, 'isWooCommerceActive' ).mockImplementation( () => true );
		jest.spyOn( mockSelectMethods, 'getActiveExperience' ).mockImplementation( () => 'embedded' );
		jest
			.spyOn( mockSelectMethods, 'isWooCommerceSearchTemplateOverrideEnabled' )
			.mockImplementation( () => true );

		render( <DashboardPage /> );
		fireEvent.click( screen.getByRole( 'tab', { name: /settings/i } ) );

		expect( screen.getByTestId( 'woocommerce-product-search-control' ) ).toBeInTheDocument();
		expect( mockWooCommerceProductSearchControl ).toHaveBeenCalledWith(
			expect.objectContaining( {
				isEnabled: true,
				isSaving: false,
				updateOptions: mockDispatchMethods.updateJetpackSettings,
			} )
		);
	} );

	test( 'renders WooCommerceProductSearchControl for the Theme search (inline) experience', () => {
		jest.spyOn( mockSelectMethods, 'isSearchBlocksEnabled' ).mockImplementation( () => true );
		jest.spyOn( mockSelectMethods, 'isWooCommerceActive' ).mockImplementation( () => true );
		jest.spyOn( mockSelectMethods, 'getActiveExperience' ).mockImplementation( () => 'inline' );

		render( <DashboardPage /> );
		fireEvent.click( screen.getByRole( 'tab', { name: /settings/i } ) );

		expect( screen.getByTestId( 'woocommerce-product-search-control' ) ).toBeInTheDocument();
	} );

	test( 'hides WooCommerceProductSearchControl on non-WooCommerce sites', () => {
		jest.spyOn( mockSelectMethods, 'isSearchBlocksEnabled' ).mockImplementation( () => true );
		jest.spyOn( mockSelectMethods, 'isWooCommerceActive' ).mockImplementation( () => false );

		render( <DashboardPage /> );
		fireEvent.click( screen.getByRole( 'tab', { name: /settings/i } ) );

		expect( screen.queryByTestId( 'woocommerce-product-search-control' ) ).not.toBeInTheDocument();
		expect( mockWooCommerceProductSearchControl ).not.toHaveBeenCalled();
	} );

	test( 'routes editTemplateUrl through the Site Editor on block themes', () => {
		jest.spyOn( mockSelectMethods, 'isSearchBlocksEnabled' ).mockImplementation( () => true );
		jest.spyOn( mockSelectMethods, 'isWooCommerceActive' ).mockImplementation( () => true );
		jest.spyOn( mockSelectMethods, 'getActiveExperience' ).mockImplementation( () => 'embedded' );
		jest
			.spyOn( mockSelectMethods, 'isWooCommerceSearchTemplateOverrideEnabled' )
			.mockImplementation( () => true );
		jest.spyOn( mockSelectMethods, 'isBlockTheme' ).mockImplementation( () => true );

		render( <DashboardPage /> );
		fireEvent.click( screen.getByRole( 'tab', { name: /settings/i } ) );

		expect( mockWooCommerceProductSearchControl ).toHaveBeenCalledWith(
			expect.objectContaining( {
				editTemplateUrl: expect.stringContaining( 'site-editor.php' ),
			} )
		);
	} );

	test( 'routes templateConfig through the singleton CPT on classic themes', () => {
		// Regression guard for SEARCH-259's classic-theme fix: a classic
		// theme has no Site Editor, so the Site Editor URL is a dead link.
		// `dashboard-page.jsx` branches on `isBlockTheme` and routes to
		// `Product_Search_Template`'s CPT editor URL instead.
		const cptEditorUrl =
			'https://example.com/wp-admin/admin.php?page=jetpack-search&jetpack_search_open_product_template_editor=1&_wpnonce=ABC';
		jest.spyOn( mockSelectMethods, 'isSearchBlocksEnabled' ).mockImplementation( () => true );
		jest.spyOn( mockSelectMethods, 'isWooCommerceActive' ).mockImplementation( () => true );
		jest.spyOn( mockSelectMethods, 'getActiveExperience' ).mockImplementation( () => 'embedded' );
		jest
			.spyOn( mockSelectMethods, 'isWooCommerceSearchTemplateOverrideEnabled' )
			.mockImplementation( () => true );
		jest.spyOn( mockSelectMethods, 'isBlockTheme' ).mockImplementation( () => false );
		jest.spyOn( mockSelectMethods, 'getProductSearchTemplateConfig' ).mockImplementation( () => ( {
			enabled: true,
			editorUrl: cptEditorUrl,
			postType: 'jp_product_search',
			isCustomized: false,
		} ) );

		render( <DashboardPage /> );
		fireEvent.click( screen.getByRole( 'tab', { name: /settings/i } ) );

		expect( mockWooCommerceProductSearchControl ).toHaveBeenCalledWith(
			expect.objectContaining( {
				templateConfig: expect.objectContaining( { editorUrl: cptEditorUrl } ),
				editTemplateUrl: null,
				editLabel: 'Edit the product search template',
			} )
		);
	} );

	test( 'hides WooCommerceProductSearchControl under the legacy Overlay experience (moot — instant search intercepts)', () => {
		jest.spyOn( mockSelectMethods, 'isSearchBlocksEnabled' ).mockImplementation( () => true );
		jest.spyOn( mockSelectMethods, 'isWooCommerceActive' ).mockImplementation( () => true );
		jest.spyOn( mockSelectMethods, 'getActiveExperience' ).mockImplementation( () => 'overlay' );

		render( <DashboardPage /> );
		fireEvent.click( screen.getByRole( 'tab', { name: /settings/i } ) );

		expect( screen.queryByTestId( 'woocommerce-product-search-control' ) ).not.toBeInTheDocument();
		expect( mockWooCommerceProductSearchControl ).not.toHaveBeenCalled();
	} );

	test( 'renders WooCommerceProductSearchControl for the blocks Overlay experience and routes templateConfig to the product overlay CPT', () => {
		// SEARCH-287: the blocks Overlay now reads the same
		// `override_woocommerce_search_template` option, so the toggle surfaces
		// here too — with the edit link pointed at the product overlay CPT
		// (post.php on every theme), not the Embedded page template.
		const overlayCptEditorUrl =
			'https://example.com/wp-admin/admin.php?page=jetpack-search&jetpack_search_open_product_overlay_editor=1&_wpnonce=XYZ';
		jest.spyOn( mockSelectMethods, 'isSearchBlocksEnabled' ).mockImplementation( () => true );
		jest.spyOn( mockSelectMethods, 'isWooCommerceActive' ).mockImplementation( () => true );
		jest
			.spyOn( mockSelectMethods, 'getActiveExperience' )
			.mockImplementation( () => 'overlay_blocks' );
		jest
			.spyOn( mockSelectMethods, 'isWooCommerceSearchTemplateOverrideEnabled' )
			.mockImplementation( () => true );
		// Block theme on purpose: the overlay must NOT fall through to the Site
		// Editor product-results URL — it's a CPT template regardless of theme.
		jest.spyOn( mockSelectMethods, 'isBlockTheme' ).mockImplementation( () => true );
		jest.spyOn( mockSelectMethods, 'getProductOverlayTemplateConfig' ).mockImplementation( () => ( {
			enabled: true,
			editorUrl: overlayCptEditorUrl,
			postType: 'jp_search_prod_ovl',
			isCustomized: false,
		} ) );

		render( <DashboardPage /> );
		fireEvent.click( screen.getByRole( 'tab', { name: /settings/i } ) );

		expect( screen.getByTestId( 'woocommerce-product-search-control' ) ).toBeInTheDocument();
		expect( mockWooCommerceProductSearchControl ).toHaveBeenCalledWith(
			expect.objectContaining( {
				templateConfig: expect.objectContaining( { editorUrl: overlayCptEditorUrl } ),
				editTemplateUrl: null,
				editLabel: 'Edit the product Search overlay',
			} )
		);
	} );

	test( 'does not render Reader Chat card in the experience selector path when unavailable', () => {
		jest.spyOn( mockSelectMethods, 'isSearchBlocksEnabled' ).mockImplementation( () => true );
		jest.spyOn( mockSelectMethods, 'isReaderChatAvailable' ).mockImplementation( () => false );

		render( <DashboardPage /> );
		fireEvent.click( screen.getByRole( 'tab', { name: /settings/i } ) );

		expect( screen.getByTestId( 'experience-selector' ) ).toBeInTheDocument();
		expect( screen.queryByTestId( 'reader-chat-control' ) ).not.toBeInTheDocument();
		expect( mockReaderChatControl ).not.toHaveBeenCalled();
	} );

	test( 'does not render Reader Chat card in the experience selector path when Search is not supported', () => {
		jest.spyOn( mockSelectMethods, 'isSearchBlocksEnabled' ).mockImplementation( () => true );
		jest.spyOn( mockSelectMethods, 'supportsSearch' ).mockImplementation( () => false );

		render( <DashboardPage /> );
		fireEvent.click( screen.getByRole( 'tab', { name: /settings/i } ) );

		expect( screen.getByTestId( 'experience-selector' ) ).toBeInTheDocument();
		expect( screen.queryByTestId( 'reader-chat-control' ) ).not.toBeInTheDocument();
		expect( mockReaderChatControl ).not.toHaveBeenCalled();
	} );

	test( 'hydrates active tab from the URL hash', () => {
		window.history.replaceState( {}, '', `${ DEFAULT_TEST_URL }#/ai-answers` );

		render( <DashboardPage /> );

		expect( screen.getByRole( 'tab', { name: /ai answers/i } ) ).toHaveAttribute(
			'aria-selected',
			'true'
		);
		expect( screen.getByRole( 'tab', { name: /overview/i } ) ).toHaveAttribute(
			'aria-selected',
			'false'
		);
		expect( screen.getByTestId( 'ai-answers-tab' ) ).toBeInTheDocument();
	} );

	test( 'falls back to the default tab when the URL hash is unknown', () => {
		window.history.replaceState( {}, '', `${ DEFAULT_TEST_URL }#/unknown` );

		render( <DashboardPage /> );

		expect( screen.getByRole( 'tab', { name: /overview/i } ) ).toHaveAttribute(
			'aria-selected',
			'true'
		);
		// Mount-time normalization rewrites the unknown hash to the canonical default.
		expect( window.location.hash ).toBe( '#/overview' );
	} );

	test( 'resolves the legacy plan-usage slug in the hash to the Overview tab', () => {
		window.history.replaceState( {}, '', `${ DEFAULT_TEST_URL }#/plan-usage` );

		render( <DashboardPage /> );

		expect( screen.getByRole( 'tab', { name: /overview/i } ) ).toHaveAttribute(
			'aria-selected',
			'true'
		);
		// Normalized to the canonical Overview hash.
		expect( window.location.hash ).toBe( '#/overview' );
	} );

	test( 'normalizes legacy ?tab= query strings to the equivalent hash on mount', () => {
		window.history.replaceState( {}, '', `${ DEFAULT_TEST_URL }&tab=ai-answers` );

		render( <DashboardPage /> );

		expect( screen.getByRole( 'tab', { name: /ai answers/i } ) ).toHaveAttribute(
			'aria-selected',
			'true'
		);
		expect( window.location.hash ).toBe( '#/ai-answers' );
		expect( window.location.search ).not.toContain( 'tab=' );
	} );

	test( 'normalizes legacy ?tab=plan-usage to the new Overview hash on mount', () => {
		window.history.replaceState( {}, '', `${ DEFAULT_TEST_URL }&tab=plan-usage` );

		render( <DashboardPage /> );

		expect( screen.getByRole( 'tab', { name: /overview/i } ) ).toHaveAttribute(
			'aria-selected',
			'true'
		);
		expect( window.location.hash ).toBe( '#/overview' );
		expect( window.location.search ).not.toContain( 'tab=' );
	} );

	test( 'updates the URL hash when tabs are changed', async () => {
		const user = userEvent.setup();

		render( <DashboardPage /> );
		await user.click( screen.getByRole( 'tab', { name: /ai answers/i } ) );

		await waitFor( () => expect( window.location.hash ).toBe( '#/ai-answers' ) );
	} );

	test( 'syncs active tab when the hash changes externally (back/forward)', () => {
		render( <DashboardPage /> );

		expect( screen.getByRole( 'tab', { name: /overview/i } ) ).toHaveAttribute(
			'aria-selected',
			'true'
		);

		act( () => {
			window.location.hash = '/settings';
			window.dispatchEvent( new HashChangeEvent( 'hashchange' ) );
		} );

		expect( screen.getByRole( 'tab', { name: /settings/i } ) ).toHaveAttribute(
			'aria-selected',
			'true'
		);
	} );

	test( 'normalizes a plain URL to the canonical #/overview hash on mount', () => {
		// No hash, no `?tab=` — the canonical default for first-time visitors.
		render( <DashboardPage /> );

		expect( screen.getByRole( 'tab', { name: /overview/i } ) ).toHaveAttribute(
			'aria-selected',
			'true'
		);
		expect( window.location.hash ).toBe( '#/overview' );
	} );

	test( 'normalizes the current-slug legacy query (?tab=overview) to #/overview on mount', () => {
		window.history.replaceState( {}, '', `${ DEFAULT_TEST_URL }&tab=overview` );

		render( <DashboardPage /> );

		expect( screen.getByRole( 'tab', { name: /overview/i } ) ).toHaveAttribute(
			'aria-selected',
			'true'
		);
		expect( window.location.hash ).toBe( '#/overview' );
		expect( window.location.search ).not.toContain( 'tab=' );
	} );

	test( 'canonicalizes the URL when an external hashchange lands on a legacy slug', () => {
		render( <DashboardPage /> );

		act( () => {
			window.location.hash = '/plan-usage';
			window.dispatchEvent( new HashChangeEvent( 'hashchange' ) );
		} );

		expect( screen.getByRole( 'tab', { name: /overview/i } ) ).toHaveAttribute(
			'aria-selected',
			'true'
		);
		expect( window.location.hash ).toBe( '#/overview' );
	} );
} );
