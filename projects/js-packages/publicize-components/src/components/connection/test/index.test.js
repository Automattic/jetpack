import { jest } from '@jest/globals';
import { render, renderHook, screen } from '@testing-library/react';
import { useSelect } from '@wordpress/data';
import React from 'react';
import { SOCIAL_STORE_ID } from '../../../social-store';
import PublicizeConnection from '../index';

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
		renderHook( () => useSelect( select => ( storeSelect = select( SOCIAL_STORE_ID ) ) ) );
		jest.spyOn( storeSelect, 'getFailedConnections' ).mockReset().mockReturnValue( [] );

		render( <PublicizeConnection { ...props } /> );
		expect( screen.getByTitle( props.label ) ).toBeInTheDocument();
	} );
} );
