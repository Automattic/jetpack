import { render, screen } from '@testing-library/react';
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

const renderSection = () =>
	render(
		<MoreFeatures
			groups={ [ { label: 'Engagement', states: [ getModuleFeatureState( sharing, {} ) ] } ] }
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
} );
