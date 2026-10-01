// The module reads the URL and storage on import, so it's required after they're set.
import { render } from '@testing-library/react';
import { BlockEdit, store as blockEditorStore } from '@wordpress/block-editor';
import { createBlock, registerBlockType } from '@wordpress/blocks';
import { dispatch } from '@wordpress/data';

describe( 'StripeConnectionNotice', () => {
	test( 'shows the result only in the block that started the connection, after reload', () => {
		window.history.pushState( {}, '', '/?stripe_connect_success=1' );
		const stored = JSON.stringify( { name: 'test/payment', index: 1 } );
		window.sessionStorage.setItem( 'jetpackStripeConnectOriginBlock', stored );

		const {
			StripeConnectionNotice,
			rememberStripeConnectOrigin,
		} = require( '../stripe-connection-notification' );
		registerBlockType( 'test/payment', {
			apiVersion: 3,
			title: 'Payment',
			category: 'text',
			edit: () => <StripeConnectionNotice />,
		} );
		const blocks = [ createBlock( 'test/payment' ), createBlock( 'test/payment' ) ];
		dispatch( blockEditorStore ).resetBlocks( blocks );

		const [ first, second ] = blocks.map(
			block =>
				render( <BlockEdit name={ block.name } clientId={ block.clientId } attributes={ {} } /> )
					.container
		);

		expect( first ).not.toHaveTextContent( /now connected to Stripe/ );
		expect( second ).toHaveTextContent( /now connected to Stripe/ );

		rememberStripeConnectOrigin( blocks[ 1 ].clientId );
		expect( window.sessionStorage.getItem( 'jetpackStripeConnectOriginBlock' ) ).toBe( stored );
	} );
} );
