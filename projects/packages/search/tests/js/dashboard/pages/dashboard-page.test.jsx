import { render, screen } from '@testing-library/react';
import { createRegistry, createReduxStore, RegistryProvider } from '@wordpress/data';
import DashboardPage from '../../../../src/dashboard/components/pages/dashboard-page';
import { storeConfig, STORE_ID } from '../../../../src/dashboard/store';

// jetpack-components and connection components reach into globals; mock the
// surface we don't care about for this test.
jest.mock( '@automattic/jetpack-components', () => ( {
	AdminPage: ( { children } ) => <div data-testid="admin-page">{ children }</div>,
	Button: ( { children, ...rest } ) => <button { ...rest }>{ children }</button>,
	Container: ( { children } ) => <div>{ children }</div>,
	Col: ( { children } ) => <div>{ children }</div>,
	getProductCheckoutUrl: () => '#',
} ) );
jest.mock( '@automattic/jetpack-connection', () => ( {
	useConnectionErrorNotice: () => ( { hasConnectionError: false } ),
	useConnection: () => ( {} ),
	ConnectionError: () => null,
} ) );

// Stub heavy sub-components that aren't relevant to the branching test.
jest.mock( 'components/mocked-search', () => () => <div data-testid="mocked-search" /> );
jest.mock( 'components/module-control', () => () => <div data-testid="module-control" /> );
jest.mock( 'components/record-meter', () => () => <div data-testid="record-meter" /> );
jest.mock( 'components/global-notices', () => () => null );
jest.mock( 'components/loading', () => () => <div data-testid="loading" /> );

const renderWith = ( { searchBlocksEnabled, jetpackSettings } ) => {
	const registry = createRegistry();
	const store = createReduxStore( STORE_ID, {
		...storeConfig,
		initialState: {
			...( storeConfig.initialState || {} ),
			siteData: {
				...( storeConfig.initialState?.siteData || {} ),
				searchBlocksEnabled,
			},
			jetpackSettings,
			sitePlan: {},
			features: [],
		},
	} );
	registry.register( store );

	// Mark the three resolvers that gate isPageLoading as finished so the
	// loading spinner doesn't hide the page content.
	registry.dispatch( STORE_ID ).finishResolution( 'getSearchModuleStatus', [] );
	registry.dispatch( STORE_ID ).finishResolution( 'getSearchStats', [] );
	registry.dispatch( STORE_ID ).finishResolution( 'getSearchPlanInfo', [] );

	return render(
		<RegistryProvider value={ registry }>
			<DashboardPage isLoading={ false } />
		</RegistryProvider>
	);
};

const settings = {
	module_active: true,
	instant_search_enabled: false,
	pending_experience: null,
	last_saved_experience: null,
	is_updating: false,
};

describe( '<DashboardPage> branch', () => {
	test( 'renders FeatureSelector when searchBlocksEnabled is true', () => {
		renderWith( { searchBlocksEnabled: true, jetpackSettings: settings } );
		expect(
			screen.getByRole( 'group', { name: /pick what visitors see when they search/i } )
		).toBeInTheDocument();
	} );

	test( 'renders ModuleControl when searchBlocksEnabled is false', () => {
		renderWith( { searchBlocksEnabled: false, jetpackSettings: settings } );
		expect(
			screen.queryByRole( 'group', { name: /pick what visitors see/i } )
		).not.toBeInTheDocument();
	} );
} );
