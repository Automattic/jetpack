/* eslint-disable testing-library/prefer-user-event */
import { fireEvent, render, screen } from '@testing-library/react';
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
jest.mock( 'components/feature-selector', () => () => <div data-testid="feature-selector" /> );
jest.mock( 'components/record-meter', () => () => <div data-testid="record-meter" /> );
jest.mock( 'components/global-notices', () => () => null );
jest.mock( 'components/loading', () => () => <div data-testid="loading" /> );
jest.mock( 'components/ai-answers-tab', () => () => <div data-testid="ai-answers-tab" /> );

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
	experience: null,
	is_updating: false,
};

describe( '<DashboardPage> branch', () => {
	test( 'renders Plan & Usage and AI Answers tabs', () => {
		renderWith( { searchBlocksEnabled: false, jetpackSettings: settings } );
		expect( screen.getByRole( 'tab', { name: /plan & usage/i } ) ).toBeInTheDocument();
		expect( screen.getByRole( 'tab', { name: /ai answers/i } ) ).toBeInTheDocument();
	} );

	test( 'renders FeatureSelector when searchBlocksEnabled is true', () => {
		renderWith( { searchBlocksEnabled: true, jetpackSettings: settings } );
		// The selector lives in the Settings tab, which isn't visible until selected.
		fireEvent.click( screen.getByRole( 'tab', { name: /settings/i } ) );
		expect( screen.getByTestId( 'feature-selector' ) ).toBeInTheDocument();
		expect( screen.queryByTestId( 'module-control' ) ).not.toBeInTheDocument();
	} );

	test( 'renders ModuleControl when searchBlocksEnabled is false', () => {
		renderWith( { searchBlocksEnabled: false, jetpackSettings: settings } );
		fireEvent.click( screen.getByRole( 'tab', { name: /settings/i } ) );
		expect( screen.queryByTestId( 'feature-selector' ) ).not.toBeInTheDocument();
		expect( screen.getByTestId( 'module-control' ) ).toBeInTheDocument();
	} );
} );
