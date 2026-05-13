const mockModuleControl = jest.fn();
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
jest.mock( 'components/record-meter', () => () => <div data-testid="record-meter" /> );
jest.mock( '../sections/first-run-section', () => () => <div data-testid="first-run-section" /> );
jest.mock( '../sections/plan-usage-section', () => () => <div data-testid="plan-usage-section" /> );

/* eslint-disable testing-library/prefer-user-event */
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
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
	getSearchModuleStatus: jest.fn(),
	getSearchPlanInfo: jest.fn(),
	getSearchStats: jest.fn(),
	getSiteAdminUrl: jest.fn( () => 'https://example.com/wp-admin/' ),
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
	isReaderChatAvailable: jest.fn( () => true ),
	isReaderChatEnabled: jest.fn( () => true ),
	isResolving: jest.fn( () => false ),
	isSearchBlocksEnabled: jest.fn( () => false ),
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
		window.history.replaceState( {}, '', DEFAULT_TEST_URL );
		mockSelectMethods = createSelectMethods();
		mockDispatchMethods = {
			removeNotice: jest.fn(),
			updateJetpackSettings: jest.fn(),
		};
	} );

	test( 'passes Reader Chat settings to the Search settings control', () => {
		render( <DashboardPage /> );

		// The settings control lives in the Settings tab, which isn't visible until selected.
		fireEvent.click( screen.getByRole( 'tab', { name: /settings/i } ) );

		expect( screen.getByTestId( 'module-control' ) ).toBeInTheDocument();
		expect( mockModuleControl ).toHaveBeenCalledWith(
			expect.objectContaining( {
				isReaderChatAvailable: true,
				isReaderChatEnabled: true,
				readerChatGuidelinesUrl:
					'https://example.com/wp-admin/options-general.php?page=guidelines-wp-admin',
				updateOptions: mockDispatchMethods.updateJetpackSettings,
			} )
		);
		expect( mockSelectMethods.getReaderChatGuidelinesUrl ).toHaveBeenCalled();
	} );

	test( 'hydrates active tab from the URL query string', () => {
		window.history.replaceState( {}, '', `${ DEFAULT_TEST_URL }&tab=ai-answers` );

		render( <DashboardPage /> );

		expect( screen.getByRole( 'tab', { name: /ai answers/i } ) ).toHaveAttribute(
			'aria-selected',
			'true'
		);
		expect( screen.getByTestId( 'ai-answers-tab' ) ).toBeInTheDocument();
	} );

	test( 'falls back to the default tab when URL tab is unknown', () => {
		window.history.replaceState( {}, '', `${ DEFAULT_TEST_URL }&tab=unknown` );

		render( <DashboardPage /> );

		expect( screen.getByRole( 'tab', { name: /plan & usage/i } ) ).toHaveAttribute(
			'aria-selected',
			'true'
		);
	} );

	test( 'updates the URL tab query string when tabs are changed', async () => {
		const user = userEvent.setup();
		const replaceStateSpy = jest.spyOn( window.history, 'replaceState' );

		render( <DashboardPage /> );
		await user.click( screen.getByRole( 'tab', { name: /ai answers/i } ) );

		await waitFor( () =>
			expect( replaceStateSpy ).toHaveBeenCalledWith(
				{},
				'',
				`${ DEFAULT_TEST_URL }&tab=ai-answers`
			)
		);
		replaceStateSpy.mockRestore();
	} );
} );
