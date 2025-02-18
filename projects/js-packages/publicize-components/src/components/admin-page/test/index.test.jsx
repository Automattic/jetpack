import { render, renderHook, screen } from '@testing-library/react';
import { useSelect, createReduxStore, register } from '@wordpress/data';
import React from 'react';
import { SOCIAL_STORE_CONFIG, SOCIAL_STORE_ID } from '../../../social-store';
import { SocialAdminPage } from '../index';

const store = createReduxStore( SOCIAL_STORE_ID, SOCIAL_STORE_CONFIG );
register( store );

describe( 'load the app', () => {
	const version = '99.9';

	beforeEach( () => {
		window.JetpackScriptData = {
			site: {
				host: 'unknown',
			},
			social: {
				api_paths: {},
				plugin_info: {
					social: {
						version,
					},
				},
			},
		};
	} );

	test( 'container renders', () => {
		let storeSelect;
		renderHook( () => useSelect( select => ( storeSelect = select( SOCIAL_STORE_ID ) ) ) );
		jest.spyOn( storeSelect, 'getSocialSettings' ).mockReset().mockReturnValue( {
			showPricingPage: true,
		} );
		render( <SocialAdminPage /> );
		expect( screen.getByText( `Jetpack Social ${ version }` ) ).toBeInTheDocument();
	} );
} );
