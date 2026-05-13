import { render, screen } from '@testing-library/react';
import { clearMockedScriptData, mockScriptData } from '../../../utils/test-utils';
import { SocialAdminPage } from '../index';

describe( 'load the app', () => {
	beforeEach( () => {
		mockScriptData( {
			social: {
				plugin_info: {
					social: {
						version: '99.9',
					},
				},
			},
		} );
	} );

	afterEach( () => {
		clearMockedScriptData();
	} );

	test( 'container renders', () => {
		render( <SocialAdminPage /> );
		expect( screen.getByText( 'Jetpack' ) ).toBeInTheDocument();
	} );
} );
