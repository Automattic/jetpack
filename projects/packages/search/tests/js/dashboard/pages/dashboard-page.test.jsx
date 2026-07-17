/* eslint-disable testing-library/prefer-user-event */
// jetpack-components and connection components reach into globals; mock the
// surface we don't care about for this test before importing the dashboard.
jest.mock(
	'@automattic/jetpack-components',
	() => ( {
		AdminPage: ( { children } ) => <div data-testid="admin-page">{ children }</div>,
		Button: ( { children, ...rest } ) => <button { ...rest }>{ children }</button>,
		Container: ( { children } ) => <div>{ children }</div>,
		Col: ( { children } ) => <div>{ children }</div>,
		DonutMeter: () => <div data-testid="donut-meter" />,
		Gridicon: () => <span data-testid="gridicon" />,
		IconTooltip: ( { children } ) => <div>{ children }</div>,
		IndeterminateProgressBar: () => <div data-testid="indeterminate-progress-bar" />,
		ThemeProvider: ( { children } ) => <>{ children }</>,
		getProductCheckoutUrl: () => '#',
	} ),
	{ virtual: true }
);
jest.mock(
	'@automattic/jetpack-connection',
	() => ( {
		useConnectionErrorNotice: () => ( { hasConnectionError: false } ),
		useConnection: () => ( {} ),
		ConnectionError: () => null,
	} ),
	{ virtual: true }
);
jest.mock(
	'@automattic/number-formatters',
	() => ( {
		formatNumber: value => String( value ),
	} ),
	{ virtual: true }
);

// Stub heavy sub-components that aren't relevant to the branching test.
jest.mock( 'components/mocked-search', () => () => <div data-testid="mocked-search" /> );
jest.mock(
	'components/module-control',
	() =>
		( { aiAgentAccessGuidelinesUrl, isAIAgentAccessAvailable } ) => (
			<div
				data-ai-agent-access-guidelines-url={ aiAgentAccessGuidelinesUrl }
				data-is-ai-agent-access-available={ isAIAgentAccessAvailable }
				data-testid="module-control"
			/>
		)
);
jest.mock( 'components/experience-selector', () => () => (
	<div data-testid="experience-selector" />
) );
jest.mock( 'components/record-meter', () => () => <div data-testid="record-meter" /> );
jest.mock( 'components/global-notices', () => () => null );
jest.mock( 'components/loading', () => () => <div data-testid="loading" /> );
jest.mock( 'components/ai-answers-tab', () => () => <div data-testid="ai-answers-tab" /> );
jest.mock(
	'components/ai-agent-access-control',
	() =>
		( { className, guidelinesUrl, isAvailable, showGuidelinesLink } ) => (
			<div
				className={ className }
				data-guidelines-url={ guidelinesUrl }
				data-is-available={ isAvailable }
				data-show-guidelines-link={ showGuidelinesLink }
				data-testid="ai-agent-access-control"
			/>
		)
);

import { fireEvent, render, screen } from '@testing-library/react';
import { createRegistry, createReduxStore, RegistryProvider } from '@wordpress/data';
import DashboardPage from '../../../../src/dashboard/components/pages/dashboard-page';
import { storeConfig, STORE_ID } from '../../../../src/dashboard/store';

const CONNECTION_STORE_ID = 'jetpack-connection';

const connectionStoreConfig = {
	reducer: ( state = {} ) => state,
	actions: {
		connectUser: () => ( { type: 'CONNECT_USER' } ),
		refreshConnectedPlugins: () => ( { type: 'REFRESH_CONNECTED_PLUGINS' } ),
		registerSite: () => ( { type: 'REGISTER_SITE' } ),
	},
	selectors: {
		getConnectedPlugins: () => [],
		getConnectionErrors: () => ( {} ),
		getConnectionStatus: () => ( {} ),
		getIsOfflineMode: () => false,
		getRegistrationError: () => false,
		getSiteIsRegistering: () => false,
		getUserConnectionData: () => ( {} ),
		getUserIsConnecting: () => false,
	},
};

const renderWith = ( {
	aiAgentAccessAvailable = true,
	aiAgentAccessGuidelinesUrl = '',
	searchBlocksEnabled,
	jetpackSettings,
} ) => {
	const registry = createRegistry();
	const store = createReduxStore( STORE_ID, {
		...storeConfig,
		initialState: {
			...( storeConfig.initialState || {} ),
			siteData: {
				...( storeConfig.initialState?.siteData || {} ),
				aiAgentAccessAvailable,
				aiAgentAccessGuidelinesUrl,
				searchBlocksEnabled,
			},
			jetpackSettings,
			sitePlan: {},
			features: [],
		},
	} );
	registry.register( store );
	registry.register( createReduxStore( CONNECTION_STORE_ID, connectionStoreConfig ) );

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
	test( 'renders Overview and AI Answers tabs', () => {
		renderWith( { searchBlocksEnabled: false, jetpackSettings: settings } );
		expect( screen.getByRole( 'tab', { name: /overview/i } ) ).toBeInTheDocument();
		expect( screen.getByRole( 'tab', { name: /ai answers/i } ) ).toBeInTheDocument();
	} );

	test( 'renders ExperienceSelector when searchBlocksEnabled is true', () => {
		renderWith( { searchBlocksEnabled: true, jetpackSettings: settings } );
		// The selector lives in the Settings tab, which isn't visible until selected.
		fireEvent.click( screen.getByRole( 'tab', { name: /settings/i } ) );
		expect( screen.getByTestId( 'experience-selector' ) ).toBeInTheDocument();
		expect( screen.getByTestId( 'ai-agent-access-control' ) ).toHaveClass(
			'jp-search-ai-agent-access-card'
		);
		expect( screen.queryByTestId( 'module-control' ) ).not.toBeInTheDocument();
	} );

	test( 'renders ModuleControl when searchBlocksEnabled is false', () => {
		renderWith( { searchBlocksEnabled: false, jetpackSettings: settings } );
		fireEvent.click( screen.getByRole( 'tab', { name: /settings/i } ) );
		expect( screen.queryByTestId( 'experience-selector' ) ).not.toBeInTheDocument();
		expect( screen.getByTestId( 'module-control' ) ).toBeInTheDocument();
	} );

	test( 'passes the AI Agent Access guidelines URL to the Search settings control', () => {
		const aiAgentAccessGuidelinesUrl =
			'https://example.com/wp-admin/options-general.php?page=guidelines-wp-admin';

		renderWith( {
			aiAgentAccessGuidelinesUrl,
			searchBlocksEnabled: false,
			jetpackSettings: settings,
		} );

		expect( screen.getByTestId( 'module-control' ) ).toHaveAttribute(
			'data-ai-agent-access-guidelines-url',
			aiAgentAccessGuidelinesUrl
		);
	} );

	test( 'passes the AI Agent Access availability to the Search settings control', () => {
		renderWith( {
			aiAgentAccessAvailable: false,
			searchBlocksEnabled: false,
			jetpackSettings: settings,
		} );

		expect( screen.getByTestId( 'module-control' ) ).toHaveAttribute(
			'data-is-ai-agent-access-available',
			'false'
		);
	} );
} );
