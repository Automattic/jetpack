import { render, screen } from '@testing-library/react';
import { clearMockedScriptData, mockScriptData } from '../../../utils/test-utils';
import { SocialAdminPage } from '../index';

describe( 'load the app', () => {
	const version = '99.9';

	beforeEach( () => {
		mockScriptData( {
			social: {
				plugin_info: {
					social: {
						version,
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
		expect( screen.getByText( `Jetpack Social ${ version }` ) ).toBeInTheDocument();
	} );
} );
