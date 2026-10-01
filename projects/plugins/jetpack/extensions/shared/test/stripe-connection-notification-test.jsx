// The module reads the URL and storage on import, so it's required after they're set.
import { render } from '@testing-library/react';
import { BlockEdit, store as blockEditorStore } from '@wordpress/block-editor';
import { createBlock, registerBlockType } from '@wordpress/blocks';
import { createReduxStore, dispatch, register, select } from '@wordpress/data';

const ORIGIN_BLOCK_KEY = 'jetpackStripeConnectOriginBlock';

describe( 'StripeConnectionNotice', () => {
	test( 'shows the result only in the remembered block, which a failed save leaves unremembered', () => {
		window.history.pushState( {}, '', '/?stripe_connect_success=1' );
		const stored = JSON.stringify( { name: 'test/payment', index: 1 } );
		window.sessionStorage.setItem( ORIGIN_BLOCK_KEY, stored );

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
		expect( select( 'core/notices' ).getNotices() ).toHaveLength( 0 );

		rememberStripeConnectOrigin( blocks[ 1 ].clientId );
		expect( window.sessionStorage.getItem( ORIGIN_BLOCK_KEY ) ).toBe( stored );

		window.sessionStorage.clear();
		register(
			createReduxStore( 'core/editor', {
				reducer: () => null,
				selectors: { didPostSaveRequestFail: () => true },
			} )
		);
		rememberStripeConnectOrigin( blocks[ 1 ].clientId );
		expect( window.sessionStorage.getItem( ORIGIN_BLOCK_KEY ) ).toBeNull();
	} );
} );
