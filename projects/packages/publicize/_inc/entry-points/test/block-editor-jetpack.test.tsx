import { render, screen } from '@testing-library/react';
import { getSocialScriptData } from '../../utils';
import { JetpackSidebar } from '../block-editor-jetpack';

// The entry point registers a plugin and wires editor actions on import. Stub
// those side effects so importing the module under test stays inert.
jest.mock( '../../utils/public-path.js', () => ( {} ) );
jest.mock( '@wordpress/plugins', () => ( {
	registerPlugin: jest.fn(),
} ) );
jest.mock( '@automattic/jetpack-shared-extension-utils', () => ( {
	handleJetpackEditorAction: jest.fn(),
} ) );
jest.mock( '../../utils/block-editor', () => ( {
	handleSharePostAction: jest.fn(),
} ) );

// Render the Fill's children inline so we can assert on the Social section.
jest.mock( '@wordpress/components', () => ( {
	Fill: ( { children }: { children: React.ReactNode } ) => <div>{ children }</div>,
} ) );
jest.mock( '../../components/block-editor/social-settings', () => ( {
	SocialSettings: () => <div data-testid="social-settings" />,
} ) );
jest.mock( '../../components/block-editor/social-panels', () => ( {
	SocialPanels: () => <div data-testid="social-panels" />,
} ) );

jest.mock( '../../utils', () => ( {
	getSocialScriptData: jest.fn(),
} ) );

const mockGetSocialScriptData = getSocialScriptData as jest.Mock;

describe( 'JetpackSidebar', () => {
	afterEach( () => {
		jest.clearAllMocks();
	} );

	it( 'renders nothing when the module is disabled and the Social plugin is not active', () => {
		mockGetSocialScriptData.mockReturnValue( {
			is_publicize_enabled: false,
			plugin_info: { social: { version: null }, jetpack: { version: '14.5' } },
		} );

		const { container } = render( <JetpackSidebar /> );

		expect( container ).toBeEmptyDOMElement();
		expect( screen.queryByTestId( 'social-settings' ) ).not.toBeInTheDocument();
		expect( screen.queryByTestId( 'social-panels' ) ).not.toBeInTheDocument();
	} );

	it( 'renders the Social section when the Publicize module is enabled', () => {
		mockGetSocialScriptData.mockReturnValue( {
			is_publicize_enabled: true,
			plugin_info: { social: { version: null }, jetpack: { version: '14.5' } },
		} );

		render( <JetpackSidebar /> );

		expect( screen.getByTestId( 'social-settings' ) ).toBeInTheDocument();
		expect( screen.getByTestId( 'social-panels' ) ).toBeInTheDocument();
	} );

	it( 'renders the Social section when the standalone Social plugin is active even if the module is disabled', () => {
		mockGetSocialScriptData.mockReturnValue( {
			is_publicize_enabled: false,
			plugin_info: { social: { version: '5.0' }, jetpack: { version: null } },
		} );

		render( <JetpackSidebar /> );

		expect( screen.getByTestId( 'social-settings' ) ).toBeInTheDocument();
		expect( screen.getByTestId( 'social-panels' ) ).toBeInTheDocument();
	} );
} );
