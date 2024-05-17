import { render, screen, within } from '@testing-library/react';
import React from 'react';
import DisconnectDialog from '../index';

describe( 'DisconnectDialog', () => {
	const testProps = {
		apiNonce: 'test',
		apiRoot: 'https://example.org/wp-json/',
		isOpen: true, // render open for tests, nothing renders if this is false
	};

	describe( 'Initially', () => {
		it( 'renders the Modal', () => {
			render( <DisconnectDialog { ...testProps } /> );
			expect(
				screen.getByRole( 'dialog', { name: 'Are you sure you want to disconnect?' } )
			).toBeInTheDocument();
		} );

		it( 'renders the "StepDisconnect" step', () => {
			render( <DisconnectDialog { ...testProps } /> );
			expect(
				within(
					screen.getByRole( 'dialog', { name: 'Are you sure you want to disconnect?' } )
				).getByRole( 'heading' )
			).toHaveTextContent( 'Are you sure you want to disconnect?' );
		} );
	} );
} );
