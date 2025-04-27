import { render, screen } from '@testing-library/react';
import { createReduxStore, register } from '@wordpress/data';
import { SOCIAL_STORE_CONFIG, SOCIAL_STORE_ID } from '../../../social-store';
import { clearMockedScriptData, mockScriptData } from '../../../utils/test-utils';
import { SocialAdminPage } from '../index';

const store = createReduxStore( SOCIAL_STORE_ID, SOCIAL_STORE_CONFIG );
register( store );

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
