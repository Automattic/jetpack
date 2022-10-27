import { jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';
import { useSelect } from '@wordpress/data';
import React from 'react';
import '../../../store';
import PublicizeConnection from '../index';

const STORE_ID = 'jetpack/publicize';

describe( 'PublicizeConnection', () => {
	test( 'renders an input', () => {
		const props = {
			name: 'headbook',
			id: 'test',
			failedConnections: [],
			label: 'Headbook',
			profilePicture: 'https://example.com/profile.jpg',
		};

		let storeSelect;
		renderHook( () => useSelect( select => ( storeSelect = select( STORE_ID ) ) ) );
		jest.spyOn( storeSelect, 'getFailedConnections' ).mockReset().mockReturnValue( [] );

		render( <PublicizeConnection { ...props } /> );
		expect( screen.getByText( props.label ) ).toBeInTheDocument();
	} );
} );
