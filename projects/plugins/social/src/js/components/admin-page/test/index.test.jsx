import { SOCIAL_STORE_ID, SOCIAL_STORE_CONFIG } from '@automattic/jetpack-publicize-components';
import { render, renderHook, screen } from '@testing-library/react';
import { useSelect, createReduxStore, register } from '@wordpress/data';
import React from 'react';
import Admin from '../index';

const store = createReduxStore( SOCIAL_STORE_ID, SOCIAL_STORE_CONFIG );
register( store );

describe( 'load the app', () => {
	test( 'container renders', () => {
		const version = '99.9';
		let storeSelect;
		renderHook( () => useSelect( select => ( storeSelect = select( SOCIAL_STORE_ID ) ) ) );
		jest.spyOn( storeSelect, 'showPricingPage' ).mockReset().mockReturnValue( true );
		jest.spyOn( storeSelect, 'hasPaidPlan' ).mockReset().mockReturnValue( true );
		jest.spyOn( storeSelect, 'isShareLimitEnabled' ).mockReset().mockReturnValue( true );
		jest.spyOn( storeSelect, 'getPluginVersion' ).mockReset().mockReturnValue( version );
		render( <Admin /> );
		expect( screen.getByText( `Jetpack Social ${ version }` ) ).toBeInTheDocument();
	} );
} );
