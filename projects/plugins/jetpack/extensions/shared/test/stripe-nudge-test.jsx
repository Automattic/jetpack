import { render, screen, waitFor } from '@testing-library/react';
import * as data from '@wordpress/data';
import { StripeNudge } from '../components/stripe-nudge';

// Mock @automattic/jetpack-script-data functions to allow isWpcomPlatformSite to be correctly used.
jest.mock( '@automattic/jetpack-script-data', () => {
	const isWpcomPlatformSite = jest.fn().mockReturnValue( false );
	return {
		isWpcomPlatformSite,
	};
} );

describe( 'Stripe nudge component', () => {
	describe( 'Membership store aware stripe nudge tests', () => {
		const selectSpy = jest.spyOn( data, 'select' );
		const ANY_VALID_CONNECT_URL = 'anyValidConnectUrl';
		const ANY_INVALID_CONNECT_URL = null;
		const ANY_BLOCK_NAME = 'anyBlockName';
		const NUDGE_RENDERED_TEXT = 'Connect to Stripe to use this block on your site';

		test( 'Given that we have a Stripe connect URL, we display the Stripe connect nudge.', async () => {
			// Given
			selectSpy.mockImplementation( () => ( {
				getConnectUrl: () => ANY_VALID_CONNECT_URL,
			} ) );

			// When
			render( <StripeNudge blockName={ ANY_BLOCK_NAME } /> );

			// Then
			await expect( screen.findByText( NUDGE_RENDERED_TEXT ) ).resolves.toBeInTheDocument();
		} );

		test( 'When we do not have a connect URL to connect to we will not show the Stripe connect nudge', async () => {
			// Given
			selectSpy.mockImplementation( () => ( {
				getConnectUrl: () => ANY_INVALID_CONNECT_URL,
			} ) );

			// When
			render( <StripeNudge blockName={ ANY_BLOCK_NAME } /> );

			// Then
			await waitFor( () =>
				expect( screen.queryByText( NUDGE_RENDERED_TEXT ) ).not.toBeInTheDocument()
			);
		} );
	} );
} );
