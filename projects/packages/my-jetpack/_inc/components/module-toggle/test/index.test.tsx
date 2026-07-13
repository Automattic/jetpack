import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ModuleToggle } from '../index';
import type { ReactNode } from 'react';

const mockToggleModule = jest.fn();
const mockTrackProductAction = jest.fn();

jest.mock( '../../../data/use-simple-mutation', () => ( {
	__esModule: true,
	default: () => ( { mutate: mockToggleModule, isPending: false } ),
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
		createSuccessNotice: jest.fn(),
		createErrorNotice: jest.fn(),
	} ),
} ) );

jest.mock( '../../my-jetpack-tab-panel/products/products-tracking-context', () => ( {
	useProductFiltersContext: () => ( { trackProductAction: mockTrackProductAction } ),
} ) );

const sharedaddyModule = {
	module: 'sharedaddy',
	name: 'Sharing',
	activated: false,
	available: true,
	description: 'Sharing buttons',
	long_description: '',
	search_terms: '',
};

const renderModuleToggle = ( ui: ReactNode ) => {
	const queryClient = new QueryClient( {
		defaultOptions: { queries: { retry: false } },
	} );

	return render( <QueryClientProvider client={ queryClient }>{ ui }</QueryClientProvider> );
};

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
		renderModuleToggle( <ModuleToggle module={ sharedaddyModule } /> );

		expect( screen.getByRole( 'link', { name: 'Open Site Editor' } ) ).toHaveAttribute(
			'href',
			'https://example.com/wp-admin/site-editor.php?p=%2Fwp_template%2Ftwentytwentyfour%2F%2Fsingle&canvas=edit'
		);
		expect( screen.queryByRole( 'checkbox' ) ).not.toBeInTheDocument();
	} );

	it( 'deactivates legacy sharing when switching to the block', async () => {
		renderModuleToggle( <ModuleToggle module={ { ...sharedaddyModule, activated: true } } /> );

		// The legacy toggle is replaced by the switch action.
		expect( screen.queryByRole( 'checkbox' ) ).not.toBeInTheDocument();

		await userEvent.click(
			screen.getByRole( 'button', { name: 'Switch to Sharing Buttons block' } )
		);

		// Deactivating legacy sharing reveals the Site Editor link ( two-step, no redirect ).
		expect( mockToggleModule ).toHaveBeenCalledWith(
			{ data: { active: false } },
			expect.objectContaining( { onSuccess: expect.any( Function ) } )
		);

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
		renderModuleToggle(
			<ModuleToggle module={ { ...sharedaddyModule, activated: true, override: 'active' } } />
		);

		expect( screen.getByRole( 'checkbox' ) ).toBeChecked();
		expect( screen.getByRole( 'checkbox' ) ).toBeDisabled();
		expect(
			screen.queryByRole( 'button', { name: 'Switch to Sharing Buttons block' } )
		).not.toBeInTheDocument();
	} );
} );
