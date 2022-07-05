import { render, screen, waitFor } from '@testing-library/react';
import * as data from '@wordpress/data';
import { StripeNudge } from '../components/stripe-nudge';

describe( 'Stripe nudge component', () => {
	describe( 'Membership store aware stripe nudge tests', () => {
		const selectSpy = jest.spyOn( data, 'select' );
		const ANY_VALID_CONNECT_URL = 'anyValidConnectUrl';
		const ANY_INVALID_CONNECT_URL = null;
		const USER_SHOULD_NOT_UPGRADE_PLAN = false;
		const USER_MUST_UPGRADE_PLAN = true;
		const ANY_BLOCK_NAME = 'anyBlockName';
		const NUDGE_RENDERED_TEXT = 'Connect to Stripe to use this block on your site';

		test( 'Given that we have a paid plan and a Stripe connect URL, we display the Stripe connect nudge.', async () => {
			// Given
			selectSpy.mockImplementation( () => ( {
				getShouldUpgrade: () => USER_SHOULD_NOT_UPGRADE_PLAN,
				getConnectUrl: () => ANY_VALID_CONNECT_URL,
			} ) );

			// When
			render( <StripeNudge blockName={ ANY_BLOCK_NAME } /> );

			// Then
			await expect( screen.findByText( NUDGE_RENDERED_TEXT ) ).resolves.toBeInTheDocument();
		} );

		test( 'When the user needs to upgrade his plan we will not show the Stripe nudge.', async () => {
			// Given
			selectSpy.mockImplementation( () => ( {
				getShouldUpgrade: () => USER_MUST_UPGRADE_PLAN,
				getConnectUrl: () => ANY_VALID_CONNECT_URL,
			} ) );

			// When
			render( <StripeNudge blockName={ ANY_BLOCK_NAME } /> );

			// Then
			await waitFor( () =>
				expect( screen.queryByText( NUDGE_RENDERED_TEXT ) ).not.toBeInTheDocument()
			);
		} );

		test( 'When we do not have a connect URL to connect to we will not show the Stripe connect nudge', async () => {
			// Given
			selectSpy.mockImplementation( () => ( {
				getShouldUpgrade: () => USER_SHOULD_NOT_UPGRADE_PLAN,
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
