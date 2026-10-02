import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import useAnalytics from '../../../../hooks/use-analytics';
import { FeatureItem, getModuleSettingsUrl } from '../feature-item';
import { FeaturesTrackingProvider } from '../features-tracking-context';
import { MoreFeatures } from '../more-features';
import { getModuleFeatureState } from '../use-more-features';
import type { MyJetpackModule } from '../../../../types';
import type { FeatureSelection } from '../use-feature-selection';

jest.mock( '../../../../hooks/use-analytics' );

// The real switch reports through this; here it is held onto and called directly.
const mockModuleSwitch: { onSwitch?: ( active: boolean ) => void } = {};

jest.mock( '../../../module-toggle', () => ( {
	ModuleToggle: ( {
		module: $module,
		onSwitch,
	}: {
		module: MyJetpackModule;
		onSwitch?: ( active: boolean ) => void;
	} ) => {
		mockModuleSwitch.onSwitch = onSwitch;

		// ds-allow: button -- a stand-in for the mocked control, never rendered in the product.
		return <button type="button">Toggle { $module.name }</button>;
	},
} ) );

const recordEvent = jest.fn();

beforeEach( () => {
	jest.clearAllMocks();
	mockModuleSwitch.onSwitch = undefined;
	( useAnalytics as jest.MockedFunction< typeof useAnalytics > ).mockReturnValue( { recordEvent } );
} );

const setSiteEditor = ( siteEditor: unknown ) => {
	window.JetpackScriptData = {
		site: { admin_url: 'https://example.com/wp-admin/' },
		myJetpack: { siteEditor },
	} as Window[ 'JetpackScriptData' ];
};

const sharing = {
	module: 'sharedaddy',
	name: 'Sharing Buttons',
	description: 'Add sharing buttons to your posts.',
	activated: false,
	available: true,
} as MyJetpackModule;

const selection = {
	isSelected: () => false,
	onSelect: jest.fn(),
} as unknown as FeatureSelection;

const section = ( $module = sharing, requested: Record< string, boolean > = {} ) => (
	<MoreFeatures
		groups={ [ { label: 'Engagement', states: [ getModuleFeatureState( $module, requested ) ] } ] }
		selection={ selection }
		jetpack="active"
	/>
);

const renderSection = ( ...args: Parameters< typeof section > ) => render( section( ...args ) );

describe( 'MoreFeatures', () => {
	it( 'says what to do in the Site Editor, and drops the status badge, where the block replaces the module', () => {
		setSiteEditor( {
			isBlockTheme: true,
			isSharingBlockAvailable: true,
			activeThemeStylesheet: 'twentytwentyfour',
		} );

		renderSection();

		expect(
			screen.getByText( 'Add the Sharing Buttons block to your theme’s template.' )
		).toBeInTheDocument();
		expect( screen.queryByText( 'Inactive' ) ).not.toBeInTheDocument();
	} );

	it( 'keeps the module description and badge on a classic theme', () => {
		setSiteEditor( { isBlockTheme: false } );

		renderSection();

		expect( screen.getByText( sharing.description ) ).toBeInTheDocument();
		expect( screen.getByText( 'Inactive' ) ).toBeInTheDocument();
	} );

	it( 'renders the modules under their heading with nothing to open', () => {
		setSiteEditor( { isBlockTheme: false } );

		renderSection();

		expect( screen.getByRole( 'heading', { name: 'Engagement' } ) ).toBeInTheDocument();
		// Not a heading: WPDS fonts those differently, and these must read like the cards above.
		expect( screen.getByText( sharing.name ) ).toBeInTheDocument();
		expect( screen.queryByRole( 'heading', { name: sharing.name } ) ).not.toBeInTheDocument();
		expect( screen.queryByRole( 'button', { name: /Learn more about/ } ) ).not.toBeInTheDocument();
	} );

	it( 'links to an active module\u2019s settings, and to nothing while it is off or switching', () => {
		setSiteEditor( { isBlockTheme: false } );
		const configured = { ...sharing, configure_url: 'https://example.com/settings' };
		const link = () => screen.queryByRole( 'link', { name: 'Configure Sharing Buttons' } );

		const { rerender } = renderSection( { ...configured, activated: true } );
		expect( link() ).toHaveAttribute( 'href', 'https://example.com/settings' );

		rerender( section( configured ) );
		expect( link() ).not.toBeInTheDocument();

		rerender( section( configured, { 'module:sharedaddy': true } ) );
		expect( link() ).not.toBeInTheDocument();
	} );

	it( 'links to no settings where the Site Editor block replaces the module', () => {
		setSiteEditor( {
			isBlockTheme: true,
			isSharingBlockAvailable: true,
			activeThemeStylesheet: 'twentytwentyfour',
		} );

		renderSection( { ...sharing, activated: true, configure_url: 'https://example.com/settings' } );

		expect(
			screen.getByText( 'Legacy sharing buttons cannot be customized on block themes.' )
		).toBeInTheDocument();
		expect( screen.queryByRole( 'link', { name: /^Configure / } ) ).not.toBeInTheDocument();
	} );

	it( 'leaves the settings link to the details of a card that opens them', () => {
		setSiteEditor( { isBlockTheme: false } );
		const active = { ...sharing, activated: true, configure_url: 'https://example.com/settings' };

		render( <FeatureItem state={ getModuleFeatureState( active, {} ) } onOpen={ jest.fn() } /> );

		expect( screen.getByText( sharing.name ) ).toBeInTheDocument();
		expect( screen.queryByRole( 'link', { name: /^Configure / } ) ).not.toBeInTheDocument();
	} );

	it( 'drops a settings link that would lead only to the module\u2019s own switch', () => {
		const search = 'https://example.com/wp-admin/admin.php?page=jetpack-settings#/settings?term=x';
		const url = ( overrides: Partial< MyJetpackModule > ) =>
			getModuleSettingsUrl( { ...sharing, ...overrides } );

		expect( url( { configure_url: search, options: [] } ) ).toBeUndefined();
		expect( url( { configure_url: search } ) ).toBeUndefined();
		expect( url( { configure_url: search, options: { show_headline: true } } ) ).toBe( search );
		expect( url( { configure_url: 'https://example.com/sharing', options: [] } ) ).toBe(
			'https://example.com/sharing'
		);
	} );

	it( 'drops the widgets settings link on a block theme, which has no widget areas', () => {
		const widgets = { ...sharing, module: 'widgets', configure_url: 'https://example.com/widgets' };

		setSiteEditor( { isBlockTheme: true } );
		expect( getModuleSettingsUrl( widgets ) ).toBeUndefined();

		setSiteEditor( { isBlockTheme: false } );
		expect( getModuleSettingsUrl( widgets ) ).toBe( 'https://example.com/widgets' );
	} );
} );

describe( 'MoreFeatures tracking', () => {
	it( 'names the section a module was switched from, through the real card', () => {
		render(
			<FeaturesTrackingProvider filter="all" search="" view="grid">
				<MoreFeatures
					groups={ [ { label: 'Engagement', states: [ getModuleFeatureState( sharing, {} ) ] } ] }
					selection={ selection }
					jetpack="active"
				/>
			</FeaturesTrackingProvider>
		);

		act( () => mockModuleSwitch.onSwitch?.( true ) );

		expect( recordEvent ).toHaveBeenCalledWith(
			'jetpack_myjetpack_feature_action',
			expect.objectContaining( {
				action: 'activate',
				origin: 'more_features',
				feature_slug: 'sharedaddy',
			} )
		);
	} );

	it( 'names the section behind its offer to activate Jetpack', async () => {
		render(
			<QueryClientProvider client={ new QueryClient() }>
				<FeaturesTrackingProvider filter="all" search="" view="grid">
					<MoreFeatures groups={ [] } selection={ selection } jetpack="inactive" />
				</FeaturesTrackingProvider>
			</QueryClientProvider>
		);

		await userEvent.click( screen.getByRole( 'button', { name: 'Activate Jetpack' } ) );

		expect( recordEvent ).toHaveBeenCalledWith(
			'jetpack_myjetpack_feature_action',
			expect.objectContaining( { action: 'activate', origin: 'more_features' } )
		);
	} );
	it( 'names the section from the list view too, not just the grid', () => {
		render(
			<FeaturesTrackingProvider filter="all" search="" view="list">
				<MoreFeatures
					groups={ [ { label: 'Engagement', states: [ getModuleFeatureState( sharing, {} ) ] } ] }
					selection={ selection }
					jetpack="active"
					isList
				/>
			</FeaturesTrackingProvider>
		);

		act( () => mockModuleSwitch.onSwitch?.( true ) );

		expect( recordEvent ).toHaveBeenCalledWith(
			'jetpack_myjetpack_feature_action',
			expect.objectContaining( { origin: 'more_features', feature_slug: 'sharedaddy' } )
		);
	} );
} );
