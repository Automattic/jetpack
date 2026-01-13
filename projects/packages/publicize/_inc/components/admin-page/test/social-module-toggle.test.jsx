import { render, screen } from '@testing-library/react';
import { clearMockedScriptData, mockScriptData } from '../../../utils/test-utils';
import SocialModuleToggle from '../toggles/social-module-toggle';

describe( 'SocialModuleToggle', () => {
	beforeEach( () => {
		mockScriptData( {
			social: {
				urls: { connectionsManagementPage: 'https://example.com/connections' },
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
