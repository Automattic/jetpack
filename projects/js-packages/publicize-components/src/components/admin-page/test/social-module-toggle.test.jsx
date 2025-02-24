// eslint-disable-next-line import/order -- This is a test file and we need to import the mocks first
import { mockStore } from '../../../utils/test-mocks';
import { getScriptData } from '@automattic/jetpack-script-data';
import { render, screen } from '@testing-library/react';
import { useDispatch } from '@wordpress/data';
import { getSocialScriptData, hasSocialPaidFeatures } from '../../../utils';
import SocialModuleToggle from '../toggles/social-module-toggle';

jest.mock( '../../connection-management', () => () => <div data-testid="connection-management" /> );

describe( 'SocialModuleToggle', () => {
	const mockUpdateSettings = jest.fn();

	beforeEach( () => {
		jest.clearAllMocks();
		mockStore();

		// Mock dispatch to capture updateSocialModuleSettings calls
		useDispatch.mockReturnValue( {
			updateSocialModuleSettings: mockUpdateSettings,
		} );

		// Default script data mocks
		getScriptData.mockReturnValue( {
			site: {
				wpcom: { blog_id: '123' },
			},
		} );

		getSocialScriptData.mockReturnValue( {
			urls: { connectionsManagementPage: 'https://example.com/connections' },
			feature_flags: { useAdminUiV1: true },
			is_publicize_enabled: true,
		} );
	} );

	it( 'should render connection management component by default', () => {
		render( <SocialModuleToggle /> );

		expect( screen.getByTestId( 'connection-management' ) ).toBeInTheDocument();
		expect( screen.queryByText( /Manage social media connections/i ) ).not.toBeInTheDocument();
	} );

	it( 'should render legacy UI when useAdminUiV1 is false', () => {
		getSocialScriptData.mockReturnValue( {
			urls: { connectionsManagementPage: 'https://example.com/connections' },
			feature_flags: { useAdminUiV1: false },
			is_publicize_enabled: true,
		} );

		render( <SocialModuleToggle /> );

		expect( screen.getByText( /Manage social media connections/i ) ).toBeInTheDocument();
		expect( screen.getByText( /Manage social media connections/i ) ).toBeEnabled();
	} );

	it( 'should render with module disabled', () => {
		getSocialScriptData.mockReturnValue( {
			urls: { connectionsManagementPage: 'https://example.com/connections' },
			feature_flags: { useAdminUiV1: false },
			is_publicize_enabled: true,
		} );

		mockStore( {
			getSocialModuleSettings: () => ( { publicize: false } ),
		} );

		render( <SocialModuleToggle /> );

		expect( screen.getByText( /Manage social media connections/i ) ).toBeInTheDocument();
		expect( screen.getByText( /Manage social media connections/i ) ).toBeDisabled();
	} );

	it( 'should show upgrade trigger when no paid features', () => {
		render( <SocialModuleToggle /> );

		expect( screen.getByText( /Unlock advanced sharing options/i ) ).toBeInTheDocument();
	} );

	it( 'should not show upgrade trigger with paid features', () => {
		hasSocialPaidFeatures.mockReturnValue( true );
		render( <SocialModuleToggle /> );

		expect( screen.queryByText( /Unlock advanced sharing options/i ) ).not.toBeInTheDocument();
	} );
} );
