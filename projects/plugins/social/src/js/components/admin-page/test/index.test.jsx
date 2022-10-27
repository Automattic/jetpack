import { render } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';
import { useSelect } from '@wordpress/data';
import React from 'react';
import { STORE_ID } from '../../../store';
import Admin from '../index';

describe( 'load the app', () => {
	test( 'container renders', () => {
		let storeSelect;
		renderHook( () => useSelect( select => ( storeSelect = select( STORE_ID ) ) ) );
		jest.spyOn( storeSelect, 'showPricingPage' ).mockReset().mockReturnValue( true );
		render( <Admin /> );
		expect( screen.getByClassName( 'admin-page' ) ).toBeInTheDocument();
	} );
} );
