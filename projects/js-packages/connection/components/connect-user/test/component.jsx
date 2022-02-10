/**
 * External dependencies
 */
import React from 'react';
import { expect } from 'chai';
import ShallowRenderer from 'react-test-renderer/shallow';

/**
 * Internal dependencies
 */
import ConnectUser from '../index';

describe( 'ConnectUser', () => {
	const testProps = {
		connectUrl: 'https://jetpack.wordpress.com/jetpack.authorize/1/?response_type=code',
		from: 'example',
		redirectUri: 'https://example.org',
	};

	describe( 'Render the user connection - calypso', () => {
		let redirectUrl = null;
		const redirectFunc = url => ( redirectUrl = url );

		const renderer = new ShallowRenderer();
		renderer.render(
			<ConnectUser
				{ ...testProps }
				forceCalypsoFlow={ true }
				redirectFunc={ redirectFunc } // eslint-disable-line react/jsx-no-bind
			/>
		);

		it( 'the redirect happened', () => {
			expect( redirectUrl ).to.be.equal( testProps.connectUrl + '&from=' + testProps.from );
		} );
	} );
} );
