// eslint-disable-next-line import/order -- This is a test file and we need to import the mocks first
import { mockStore } from '../../../utils/test-mocks';
import { useConnection } from '@automattic/jetpack-connection';
import { isJetpackSelfHostedSite, siteHasFeature } from '@automattic/jetpack-script-data';
import { render, screen } from '@testing-library/react';
import { SocialAdminPage } from '../';
import { getSocialScriptData } from '../../../utils';

// Mock child components to simplify testing - We only test the SocialAdminPage component here
jest.mock( '../connection-screen', () => () => <div data-testid="connection-screen" /> );
jest.mock( '../header', () => () => <div data-testid="header" /> );
jest.mock( '../info-section', () => () => <div data-testid="info-section" /> );
jest.mock( '../page-header', () => () => <div data-testid="page-header" /> );
jest.mock( '../pricing-page', () => ( { onDismiss } ) => (
	<button data-testid="pricing-page" onClick={ onDismiss } onKeyDown={ onDismiss } />
) );
jest.mock( '../support-section', () => () => <div data-testid="support-section" /> );
jest.mock( '../toggles/social-image-generator-toggle', () => () => (
	<div data-testid="social-image-generator-toggle" />
) );
jest.mock( '../toggles/social-module-toggle', () => () => (
	<div data-testid="social-module-toggle" />
) );
jest.mock( '../toggles/social-notes-toggle', () => () => (
	<div data-testid="social-notes-toggle" />
) );
jest.mock( '../toggles/utm-toggle', () => () => <div data-testid="utm-toggle" /> );

describe( 'SocialAdminPage', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		mockStore();
		useConnection.mockReturnValue( {
			isUserConnected: true,
			isRegistered: true,
		} );
		isJetpackSelfHostedSite.mockReturnValue( true );
		siteHasFeature.mockReturnValue( true );
		getSocialScriptData.mockReturnValue( {
			plugin_info: {
				social: { version: '1.0.0' },
				jetpack: { version: '1.0.0' },
			},
		} );
	} );

	describe( 'Page rendering', () => {
		it( 'should render connection screen when not connected', () => {
			useConnection.mockReturnValue( {
				isUserConnected: false,
				isRegistered: false,
			} );

			render( <SocialAdminPage /> );
			expect( screen.getByTestId( 'connection-screen' ) ).toBeInTheDocument();
		} );

		it( 'should render main admin page when connected', () => {
			render( <SocialAdminPage /> );

			expect( screen.getByTestId( 'page-header' ) ).toBeInTheDocument();
			expect( screen.getByTestId( 'header' ) ).toBeInTheDocument();
			expect( screen.getByTestId( 'info-section' ) ).toBeInTheDocument();
			expect( screen.getByTestId( 'support-section' ) ).toBeInTheDocument();
		} );

		it( 'should render pricing page when showPricingPage is true and no paid features', () => {
			mockStore( {
				getSocialSettings: () => ( { showPricingPage: true } ),
			} );

			render( <SocialAdminPage /> );
			expect( screen.getByTestId( 'pricing-page' ) ).toBeInTheDocument();
		} );
	} );

	describe( 'Toggle visibility', () => {
		describe( 'UTM toggle', () => {
			it( 'should show when module is enabled', () => {
				render( <SocialAdminPage /> );
				expect( screen.getByTestId( 'utm-toggle' ) ).toBeInTheDocument();
			} );

			it( 'should not show when module is disabled', () => {
				mockStore( {
					getSocialModuleSettings: () => ( { publicize: false } ),
				} );
				render( <SocialAdminPage /> );
				expect( screen.queryByTestId( 'utm-toggle' ) ).not.toBeInTheDocument();
			} );
		} );

		describe( 'Social Notes toggle', () => {
			it( 'should show when plugin is active and module is enabled', () => {
				render( <SocialAdminPage /> );
				expect( screen.getByTestId( 'social-notes-toggle' ) ).toBeInTheDocument();
			} );

			it( 'should not show when plugin is not active', () => {
				getSocialScriptData.mockReturnValue( {
					plugin_info: {
						social: { version: null },
						jetpack: { version: '1.0.0' },
					},
				} );
				render( <SocialAdminPage /> );
				expect( screen.queryByTestId( 'social-notes-toggle' ) ).not.toBeInTheDocument();
			} );

			it( 'should not show when module is disabled', () => {
				mockStore( {
					getSocialModuleSettings: () => ( { publicize: false } ),
				} );
				render( <SocialAdminPage /> );
				expect( screen.queryByTestId( 'social-notes-toggle' ) ).not.toBeInTheDocument();
			} );
		} );

		describe( 'Social Image Generator toggle', () => {
			it( 'should show when feature is available and module is enabled', () => {
				render( <SocialAdminPage /> );
				expect( screen.getByTestId( 'social-image-generator-toggle' ) ).toBeInTheDocument();
			} );

			it( 'should not show when feature is not available', () => {
				siteHasFeature.mockReturnValue( false );
				render( <SocialAdminPage /> );
				expect( screen.queryByTestId( 'social-image-generator-toggle' ) ).not.toBeInTheDocument();
			} );

			it( 'should not show when module is disabled', () => {
				mockStore( {
					getSocialModuleSettings: () => ( { publicize: false } ),
				} );
				render( <SocialAdminPage /> );
				expect( screen.queryByTestId( 'social-image-generator-toggle' ) ).not.toBeInTheDocument();
			} );
		} );
	} );
} );
