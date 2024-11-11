import { SOCIAL_STORE_ID, SOCIAL_STORE_CONFIG } from '@automattic/jetpack-publicize-components';
import { render, renderHook, screen } from '@testing-library/react';
import { useSelect, createReduxStore, register } from '@wordpress/data';
import React from 'react';
import Admin from '../index';

const store = createReduxStore( SOCIAL_STORE_ID, SOCIAL_STORE_CONFIG );
register( store );

describe( 'load the app', () => {
	const version = '99.9';

	beforeEach( () => {
		window.JetpackScriptData = {
			social: {
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
		jest.spyOn( storeSelect, 'getSocialPluginSettings' ).mockReset().mockReturnValue( {
			show_pricing_page: true,
		} );
		render( <Admin /> );
		expect( screen.getByText( `Jetpack Social ${ version }` ) ).toBeInTheDocument();
	} );
} );
