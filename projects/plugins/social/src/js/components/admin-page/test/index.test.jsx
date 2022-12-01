import { render, screen } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';
import { useSelect, createReduxStore, register } from '@wordpress/data';
import React from 'react';
import { STORE_ID, storeConfig } from '../../../store';
import Admin from '../index';

const store = createReduxStore( STORE_ID, storeConfig );
register( store );

describe( 'load the app', () => {
	test( 'container renders', () => {
		const version = '99.9';
		let storeSelect;
		renderHook( () => useSelect( select => ( storeSelect = select( STORE_ID ) ) ) );
		jest.spyOn( storeSelect, 'showPricingPage' ).mockReset().mockReturnValue( true );
		jest.spyOn( storeSelect, 'hasPaidPlan' ).mockReset().mockReturnValue( true );
		jest.spyOn( storeSelect, 'isShareLimitEnabled' ).mockReset().mockReturnValue( true );
		jest.spyOn( storeSelect, 'getPluginVersion' ).mockReset().mockReturnValue( version );
		render( <Admin /> );
		expect( screen.getByLabelText( `Jetpack Social ${ version }` ) ).toBeInTheDocument();
	} );
} );
