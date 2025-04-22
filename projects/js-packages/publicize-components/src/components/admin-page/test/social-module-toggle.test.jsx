import { render, screen } from '@testing-library/react';
import { clearMockedScriptData, mockScriptData } from '../../../utils/test-utils';
import SocialModuleToggle from '../toggles/social-module-toggle';

describe( 'SocialModuleToggle', () => {
	beforeEach( () => {
		mockScriptData( {
			social: {
				urls: { connectionsManagementPage: 'https://example.com/connections' },
				feature_flags: { useAdminUiV1: true },
				is_publicize_enabled: true,
			},
		} );
	} );

	afterEach( () => {
		clearMockedScriptData();
	} );

	it( 'should render connection management component by default', () => {
		render( <SocialModuleToggle /> );

		expect( screen.queryByText( /Manage social media connections/i ) ).not.toBeInTheDocument();
	} );

	it( 'should render legacy UI when useAdminUiV1 is false', () => {
		mockScriptData( {
			social: {
				urls: { connectionsManagementPage: 'https://example.com/connections' },
				feature_flags: { useAdminUiV1: false },
			},
		} );

		render( <SocialModuleToggle /> );

		expect( screen.getByText( /Manage social media connections/i ) ).toBeInTheDocument();
		expect( screen.getByText( /Manage social media connections/i ) ).toBeEnabled();
	} );

	it( 'should show upgrade trigger when no paid features', () => {
		render( <SocialModuleToggle /> );

		expect( screen.getByText( /Unlock advanced sharing options/i ) ).toBeInTheDocument();
	} );

	it( 'should not show upgrade trigger with paid features', () => {
		mockScriptData( {
			site: {
				plan: {
					features: {
						active: [ 'social-enhanced-publishing' ],
					},
				},
			},
		} );
		render( <SocialModuleToggle /> );

		expect( screen.queryByText( /Unlock advanced sharing options/i ) ).not.toBeInTheDocument();
	} );
} );
