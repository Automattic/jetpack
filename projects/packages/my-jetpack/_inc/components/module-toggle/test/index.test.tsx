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
	const Anchor = ( { children, ...props } ) => {
		// Anchor-only props that shouldn't land on the DOM node.
		delete props.variant;
		delete props.tone;
		delete props.size;
		delete props.openInNewTab;
		delete props.nativeButton;
		delete props.loading;
		delete props.loadingAnnouncement;
		return react.createElement( 'a', props, children );
	};
	return {
		Button: ( { children, render: renderProp, ...props } ) => {
			// Button-only props that shouldn't land on the DOM node.
			delete props.variant;
			delete props.tone;
			delete props.size;
			delete props.openInNewTab;
			delete props.nativeButton;
			delete props.loading;
			delete props.loadingAnnouncement;
			return renderProp
				? react.cloneElement( renderProp, props, children )
				: react.createElement( 'button', props, children );
		},
		Link: Anchor,
		LinkButton: Anchor,
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

const legacyModule = ( overrides = {} ) => ( {
	module: 'sharedaddy',
	name: 'Sharing',
	activated: false,
	available: true,
	description: 'Sharing buttons',
	long_description: '',
	search_terms: '',
	...overrides,
} );

// Legacy modules a block theme can't customize, with the label of the block that replaces them.
const blockThemeModules = [
	[ 'sharedaddy', 'Switch to Sharing Buttons block' ],
	[ 'likes', 'Switch to the Like block' ],
];

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
					isLikeBlockAvailable: true,
					activeThemeStylesheet: 'twentytwentyfour',
				},
			},
		} as Window[ 'JetpackScriptData' ];
	} );

	it.each( blockThemeModules )(
		'links inactive %s to the Single template on block themes',
		module => {
			render( <ModuleToggle module={ legacyModule( { module } ) } /> );

			expect( screen.getByRole( 'link', { name: 'Open Site Editor' } ) ).toHaveAttribute(
				'href',
				'https://example.com/wp-admin/site-editor.php?p=%2Fwp_template%2Ftwentytwentyfour%2F%2Fsingle&canvas=edit'
			);
			expect( screen.queryByRole( 'checkbox' ) ).not.toBeInTheDocument();
		}
	);

	it.each( blockThemeModules )(
		'deactivates legacy %s when switching to the block',
		async ( module, switchLabel ) => {
			mockToggleModule.mockResolvedValue( true );
			render( <ModuleToggle module={ legacyModule( { module, activated: true } ) } /> );

			// The legacy toggle is replaced by the switch action.
			expect( screen.queryByRole( 'checkbox' ) ).not.toBeInTheDocument();

			await userEvent.click( screen.getByRole( 'button', { name: switchLabel } ) );

			// Deactivating the legacy module reveals the Site Editor link ( two-step, no redirect ).
			expect( mockToggleModule ).toHaveBeenCalledWith( { name: module, active: false } );

			// The switch path tracks the deactivation, like the toggle path.
			expect( mockTrackProductAction ).toHaveBeenCalledWith(
				expect.objectContaining( {
					action: 'deactivate',
					productSlug: module,
					productType: 'module',
				} )
			);
		}
	);

	it.each( blockThemeModules )(
		'keeps forced-active legacy %s non-actionable',
		( module, switchLabel ) => {
			render(
				<ModuleToggle module={ legacyModule( { module, activated: true, override: 'active' } ) } />
			);

			expect( screen.getByRole( 'checkbox' ) ).toBeChecked();
			expect( screen.getByRole( 'checkbox' ) ).toBeDisabled();
			expect( screen.queryByRole( 'button', { name: switchLabel } ) ).not.toBeInTheDocument();
		}
	);

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
