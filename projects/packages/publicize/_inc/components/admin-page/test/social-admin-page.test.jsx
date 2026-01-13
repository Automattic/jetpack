jest.mock( '@automattic/jetpack-connection', () => ( {
	useConnection: jest.fn(),
	useConnectionErrorNotice: jest.fn( () => ( { hasConnectionError: false } ) ),
} ) );

jest.mock( '../../../hooks/use-media-details', () => {
	return jest.fn( () => [ {} ] );
} );

import { useConnection } from '@automattic/jetpack-connection';
import { render, screen } from '@testing-library/react';
import { SocialAdminPage } from '../';
import { clearMockedScriptData, mockScriptData } from '../../../utils/test-utils';

describe( 'SocialAdminPage', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		useConnection.mockReturnValue( {
			isUserConnected: true,
			isRegistered: true,
		} );
		mockScriptData();
	} );

	afterEach( () => {
		clearMockedScriptData();
	} );

	describe( 'Page rendering', () => {
		it( 'should render connection screen when not connected', () => {
			useConnection.mockReturnValue( {
				isUserConnected: false,
				isRegistered: false,
			} );

			render( <SocialAdminPage /> );
			expect( screen.getByRole( 'button', { name: 'Get Started' } ) ).toBeInTheDocument();
		} );

		it( 'should render main admin page when connected', () => {
			render( <SocialAdminPage /> );

			expect( screen.getByText( 'Write once, post everywhere' ) ).toBeInTheDocument();
			expect( screen.getByText( 'Did you know?' ) ).toBeInTheDocument();
		} );

		it( 'should render pricing page when showPricingPage is true and no paid features', () => {
			mockScriptData( {
				social: {
					settings: {
						showPricingPage: true,
					},
				},
			} );

			render( <SocialAdminPage /> );

			expect( screen.getByText( 'Start for free' ) ).toBeInTheDocument();

			clearMockedScriptData();
		} );
	} );

	describe( 'Toggle visibility', () => {
		describe( 'UTM toggle', () => {
			it( 'should show when module is enabled', () => {
				render( <SocialAdminPage /> );
				expect( screen.getByText( 'Append UTM parameters to shared URLs' ) ).toBeInTheDocument();
			} );

			it( 'should not show when module is disabled', () => {
				mockScriptData( {
					social: {
						is_publicize_enabled: false,
					},
				} );
				render( <SocialAdminPage /> );
				expect(
					screen.queryByText( 'Append UTM parameters to shared URLs' )
				).not.toBeInTheDocument();

				clearMockedScriptData();
			} );
		} );

		describe( 'Social Notes toggle', () => {
			it( 'should show when plugin is active and module is enabled', () => {
				mockScriptData();
				render( <SocialAdminPage /> );
				expect( screen.getByText( 'Enable Social Notes' ) ).toBeInTheDocument();
				clearMockedScriptData();
			} );

			it( 'should not show when plugin is not active', () => {
				mockScriptData( {
					social: {
						plugin_info: {
							social: { version: null },
							jetpack: { version: '1.0.0' },
						},
					},
				} );
				render( <SocialAdminPage /> );
				expect( screen.queryByText( 'Enable Social Notes' ) ).not.toBeInTheDocument();

				clearMockedScriptData();
			} );

			it( 'should not show when module is disabled', () => {
				mockScriptData( {
					social: {
						is_publicize_enabled: false,
					},
				} );
				render( <SocialAdminPage /> );
				expect( screen.queryByText( 'Enable Social Notes' ) ).not.toBeInTheDocument();
				clearMockedScriptData();
			} );
		} );

		describe( 'Social Image Generator toggle', () => {
			it( 'should show when feature is available and module is enabled', () => {
				mockScriptData( {
					site: {
						plan: {
							features: {
								active: [ 'social-image-generator' ],
							},
						},
					},
				} );
				render( <SocialAdminPage /> );

				expect( screen.getByText( 'Enable Social Image Generator' ) ).toBeInTheDocument();

				clearMockedScriptData();
			} );

			it( 'should not show when feature is not available', () => {
				mockScriptData();
				render( <SocialAdminPage /> );
				expect( screen.queryByText( 'Enable Social Image Generator' ) ).not.toBeInTheDocument();
				clearMockedScriptData();
			} );

			it( 'should not show when module is disabled', () => {
				mockScriptData( {
					social: {
						is_publicize_enabled: false,
					},
				} );
				render( <SocialAdminPage /> );
				expect( screen.queryByText( 'Enable Social Image Generator' ) ).not.toBeInTheDocument();
				clearMockedScriptData();
			} );
		} );
	} );
} );
