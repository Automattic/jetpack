import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MyJetpackModule } from '../../../types';
import { setPendingSuccessNotice } from '../../my-jetpack-tab-panel/products/pending-notice';
import { reloadPage } from '../../my-jetpack-tab-panel/products/reload-page';
import { ModuleToggle } from '../index';

const mockToggleModule = jest.fn( () => Promise.resolve( true ) );
const mockTrackProductAction = jest.fn();
const mockCreateSuccessNotice = jest.fn();
const mockCreateErrorNotice = jest.fn();

jest.mock( '@automattic/jetpack-shared-stores', () => ( { store: {} } ) );

jest.mock( '@wordpress/data', () => ( {
	useDispatch: () => ( { updateJetpackModuleStatus: mockToggleModule } ),
	useSelect: callback => callback( () => ( { isModuleUpdating: () => false } ) ),
} ) );

jest.mock( '@wordpress/components', () => {
	const react = jest.requireActual( 'react' );
	return {
		FormToggle: props => react.createElement( 'input', { type: 'checkbox', ...props } ),
	};
} );

jest.mock( '@wordpress/ui', () => {
	const react = jest.requireActual( 'react' );
	return {
		Button: ( { children, render: renderProp, ...props } ) => {
			// Button-only props that shouldn't land on the DOM node.
			delete props.nativeButton;
			delete props.loading;
			delete props.loadingAnnouncement;
			return renderProp
				? react.cloneElement( renderProp, props, children )
				: react.createElement( 'button', props, children );
		},
		Link: ( { children, ...props } ) => react.createElement( 'a', props, children ),
	};
} );

jest.mock( '@automattic/jetpack-components', () => ( {
	useGlobalNotices: () => ( {
		createSuccessNotice: mockCreateSuccessNotice,
		createErrorNotice: mockCreateErrorNotice,
	} ),
} ) );

jest.mock( '../../my-jetpack-tab-panel/products/products-tracking-context', () => ( {
	useProductFiltersContext: () => ( { trackProductAction: mockTrackProductAction } ),
} ) );

jest.mock( '../../../utils/module-benefit-messages', () => ( {
	getModuleActivationMessage: ( _slug: string, name: string ) => `${ name } activated.`,
} ) );

// window.location can't be mocked directly, so reloadPage is its own mockable wrapper.
jest.mock( '../../my-jetpack-tab-panel/products/reload-page' );
jest.mock( '../../my-jetpack-tab-panel/products/pending-notice' );

const sharedaddyModule = {
	module: 'sharedaddy',
	name: 'Sharing',
	activated: false,
	available: true,
	description: 'Sharing buttons',
	long_description: '',
	search_terms: '',
};

const buildModule = ( overrides = {} ) =>
	( {
		module: 'podcast',
		name: 'Podcast',
		activated: true,
		...overrides,
	} ) as unknown as MyJetpackModule;

describe( 'ModuleToggle', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		window.JetpackScriptData = {
			site: { admin_url: 'https://example.com/wp-admin/' },
			myJetpack: {
				siteEditor: {
					isBlockTheme: true,
					isSharingBlockAvailable: true,
					activeThemeStylesheet: 'twentytwentyfour',
				},
			},
		} as Window[ 'JetpackScriptData' ];
	} );

	it( 'links inactive sharedaddy to the Single template on block themes', () => {
		render( <ModuleToggle module={ sharedaddyModule } /> );

		expect( screen.getByRole( 'link', { name: 'Open Site Editor' } ) ).toHaveAttribute(
			'href',
			'https://example.com/wp-admin/site-editor.php?p=%2Fwp_template%2Ftwentytwentyfour%2F%2Fsingle&canvas=edit'
		);
		expect( screen.queryByRole( 'checkbox' ) ).not.toBeInTheDocument();
	} );

	it( 'deactivates legacy sharing when switching to the block', async () => {
		mockToggleModule.mockResolvedValue( true );
		render( <ModuleToggle module={ { ...sharedaddyModule, activated: true } } /> );

		// The legacy toggle is replaced by the switch action.
		expect( screen.queryByRole( 'checkbox' ) ).not.toBeInTheDocument();

		await userEvent.click(
			screen.getByRole( 'button', { name: 'Switch to Sharing Buttons block' } )
		);

		// Deactivating legacy sharing reveals the Site Editor link ( two-step, no redirect ).
		expect( mockToggleModule ).toHaveBeenCalledWith( { name: 'sharedaddy', active: false } );

		// The switch path tracks the deactivation, like the toggle path.
		expect( mockTrackProductAction ).toHaveBeenCalledWith(
			expect.objectContaining( {
				action: 'deactivate',
				productSlug: 'sharedaddy',
				productType: 'module',
			} )
		);
	} );

	it( 'keeps forced-active legacy sharing non-actionable', () => {
		render(
			<ModuleToggle module={ { ...sharedaddyModule, activated: true, override: 'active' } } />
		);

		expect( screen.getByRole( 'checkbox' ) ).toBeChecked();
		expect( screen.getByRole( 'checkbox' ) ).toBeDisabled();
		expect(
			screen.queryByRole( 'button', { name: 'Switch to Sharing Buttons block' } )
		).not.toBeInTheDocument();
	} );

	it.each( [
		[ 'podcast', 'Podcast' ],
		[ 'subscriptions', 'Newsletter' ],
		[ 'wpcom-reader', 'WordPress.com Reader' ],
	] )( 'reloads the page after toggling the menu-registering %s module', async ( slug, name ) => {
		render( <ModuleToggle module={ buildModule( { module: slug, name } ) } /> );

		await userEvent.click( screen.getByRole( 'checkbox' ) );

		expect( mockToggleModule ).toHaveBeenCalledWith( { name: slug, active: false } );
		// Persists a notice so it survives the reload, then reloads. No inline notice.
		expect( setPendingSuccessNotice ).toHaveBeenCalledWith(
			expect.stringContaining( 'deactivated' )
		);
		expect( reloadPage ).toHaveBeenCalled();
		expect( mockCreateSuccessNotice ).not.toHaveBeenCalled();
	} );

	it( 'does not reload for a regular module and shows an inline notice instead', async () => {
		render( <ModuleToggle module={ buildModule( { module: 'sitemaps', name: 'Sitemaps' } ) } /> );

		await userEvent.click( screen.getByRole( 'checkbox' ) );

		expect( mockToggleModule ).toHaveBeenCalledWith( { name: 'sitemaps', active: false } );
		expect( reloadPage ).not.toHaveBeenCalled();
		expect( setPendingSuccessNotice ).not.toHaveBeenCalled();
		expect( mockCreateSuccessNotice ).toHaveBeenCalled();
	} );
} );
