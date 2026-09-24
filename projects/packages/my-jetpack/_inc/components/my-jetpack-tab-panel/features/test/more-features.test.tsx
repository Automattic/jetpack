import { render, screen } from '@testing-library/react';
import { getModuleSettingsUrl } from '../feature-item';
import { MoreFeatures } from '../more-features';
import { getModuleFeatureState } from '../use-more-features';
import type { MyJetpackModule } from '../../../../types';
import type { FeatureSelection } from '../use-feature-selection';

jest.mock( '../../../module-toggle', () => ( {
	ModuleToggle: ( { module: $module }: { module: MyJetpackModule } ) => (
		// ds-allow: button -- a stand-in for the mocked control, never rendered in the product.
		<button type="button">Toggle { $module.name }</button>
	),
} ) );

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

const renderSection = ( $module = sharing, requested: Record< string, boolean > = {} ) =>
	render(
		<MoreFeatures
			groups={ [
				{ label: 'Engagement', states: [ getModuleFeatureState( $module, requested ) ] },
			] }
			selection={ selection }
			jetpack="active"
		/>
	);

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
		const link = () => screen.queryByRole( 'link', { name: 'Sharing Buttons settings' } );

		const { unmount: unmountActive } = renderSection( { ...configured, activated: true } );
		expect( link() ).toHaveAttribute( 'href', 'https://example.com/settings' );
		unmountActive();

		const { unmount: unmountInactive } = renderSection( configured );
		expect( link() ).not.toBeInTheDocument();
		unmountInactive();

		renderSection( configured, { 'module:sharedaddy': true } );
		expect( link() ).not.toBeInTheDocument();
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
} );
