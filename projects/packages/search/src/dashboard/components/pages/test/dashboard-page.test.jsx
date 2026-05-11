const mockReaderChatControl = jest.fn();
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
jest.mock( 'components/module-control', () => () => <div data-testid="module-control" /> );
jest.mock( 'components/reader-chat-control', () => props => {
	mockReaderChatControl( props );
	return <div data-testid="reader-chat-control" />;
} );
jest.mock( 'components/record-meter', () => () => <div data-testid="record-meter" /> );
jest.mock( '../sections/first-run-section', () => () => <div data-testid="first-run-section" /> );
jest.mock( '../sections/plan-usage-section', () => () => <div data-testid="plan-usage-section" /> );

import { render, screen } from '@testing-library/react';
import DashboardPage from '../dashboard-page';

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
		mockReaderChatControl.mockClear();
		mockSelectMethods = createSelectMethods();
		mockDispatchMethods = {
			removeNotice: jest.fn(),
			updateJetpackSettings: jest.fn(),
		};
	} );

	test( 'passes the Reader Chat guidelines URL to the Reader Chat control', () => {
		render( <DashboardPage /> );

		expect( screen.getByTestId( 'reader-chat-control' ) ).toBeInTheDocument();
		expect( mockReaderChatControl ).toHaveBeenCalledWith(
			expect.objectContaining( {
				guidelinesUrl: 'https://example.com/wp-admin/options-general.php?page=guidelines-wp-admin',
				isAvailable: true,
				isEnabled: true,
				isSaving: false,
				updateOptions: mockDispatchMethods.updateJetpackSettings,
			} )
		);
		expect( mockSelectMethods.getReaderChatGuidelinesUrl ).toHaveBeenCalled();
	} );
} );
