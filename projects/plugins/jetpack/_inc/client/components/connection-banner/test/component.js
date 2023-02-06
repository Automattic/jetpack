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
			const button = screen.getByTestId( 'ConnectButton' );
			expect( button ).not.toHaveAttribute( 'data-connect-user' );
			expect( button ).not.toHaveAttribute( 'data-from' );
			expect( button ).not.toHaveAttribute( 'data-as-link' );
			expect( button ).not.toHaveAttribute( 'data-connect-in-place' );
		} );
	} );

	describe( "When the 'connectUser' property is set", () => {
		it( "sets the ConnectButton 'connectUser' property to true", () => {
			render( <ConnectionBanner { ...testProps } connectUser={ true } /> );
			expect( screen.getByTestId( 'ConnectButton' ) ).toHaveAttribute(
				'data-connect-user',
				'true'
			);
		} );

		it( "sets the ConnectButton 'connectUser' property to false", () => {
			render( <ConnectionBanner { ...testProps } connectUser={ false } /> );
			expect( screen.getByTestId( 'ConnectButton' ) ).toHaveAttribute(
				'data-connect-user',
				'false'
			);
		} );
	} );

	describe( "When the 'from' property is set", () => {
		it( "sets the ConnectButton 'from' property", () => {
			render( <ConnectionBanner { ...testProps } from="somewhere" /> );
			expect( screen.getByTestId( 'ConnectButton' ) ).toHaveAttribute( 'data-from', '"somewhere"' );
		} );
	} );

	describe( "When the 'asLink' property is set", () => {
		it( "sets the ConnectButton 'asLink' property to true", () => {
			render( <ConnectionBanner { ...testProps } asLink={ true } /> );
			expect( screen.getByTestId( 'ConnectButton' ) ).toHaveAttribute( 'data-as-link', 'true' );
		} );

		it( "sets the ConnectButton 'asLink' property to false", () => {
			render( <ConnectionBanner { ...testProps } asLink={ false } /> );
			expect( screen.getByTestId( 'ConnectButton' ) ).toHaveAttribute( 'data-as-link', 'false' );
		} );
	} );

	describe( "When the 'connectInPlace' property is set", () => {
		it( "sets the ConnectButton 'connectInPlace' property to true", () => {
			render( <ConnectionBanner { ...testProps } connectInPlace={ true } /> );
			expect( screen.getByTestId( 'ConnectButton' ) ).toHaveAttribute(
				'data-connect-in-place',
				'true'
			);
		} );

		it( "sets the ConnectButton 'connectInPlace' property to false", () => {
			render( <ConnectionBanner { ...testProps } connectInPlace={ false } /> );
			expect( screen.getByTestId( 'ConnectButton' ) ).toHaveAttribute(
				'data-connect-in-place',
				'false'
			);
		} );
	} );
} );
