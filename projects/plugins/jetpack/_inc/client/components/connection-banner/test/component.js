import React from 'react';
import { render, screen } from 'test/test-utils';
import { ConnectionBanner } from '../index';

// Mock ConnectButton for easier testing.
jest.mock( 'components/connect-button', () => ( {
	__esModule: true,
	default: props => {
		const data = {};
		for ( const [ k, v ] of Object.entries( props ) ) {
			data[ 'data-' + k.replace( /[A-Z]/g, m => `-${ m.toLowerCase() }` ) ] =
				v === undefined ? undefined : JSON.stringify( v );
		}
		return <div data-testid="ConnectButton" { ...data }></div>;
	},
} ) );

describe( 'ConnectionBanner', () => {
	const testProps = {
		title: 'The title',
		description: 'The description',
	};

	describe( 'Initially', () => {
		it( 'does not pass any properties to ConnectButton', () => {
			render( <ConnectionBanner { ...testProps } /> );
			const button = screen.getByLabelText( 'Connect your WordPress.com account' );
			expect( button ).toBeInTheDocument();
		} );
	} );
} );
