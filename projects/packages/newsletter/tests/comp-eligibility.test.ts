import { canCompSubscriber } from '../_inc/subscribers/lib/comp-eligibility';
import type { Subscriber, SubscriptionStatus } from '../_inc/subscribers/data/types';

/**
 * Build a minimal subscriber row.
 *
 * @param overrides - Fields to set on the row.
 * @return Subscriber.
 */
function makeSubscriber( overrides: Partial< Subscriber > ): Subscriber {
	return {
		user_id: 0,
		display_name: '',
		email_address: '',
		subscription_status: 'Subscribed',
		...overrides,
	};
}

describe( 'canCompSubscriber', () => {
	it( 'allows a subscriber with a wpcom user id', () => {
		expect( canCompSubscriber( makeSubscriber( { user_id: 229907063 } ) ) ).toBe( true );
	} );

	it( 'allows a confirmed email-only subscriber', () => {
		expect(
			canCompSubscriber(
				makeSubscriber( {
					email_address: 'reader@example.com',
					email_subscription_id: 943104114,
					subscription_status: 'Subscribed',
				} )
			)
		).toBe( true );
	} );

	it.each< SubscriptionStatus >( [ 'Not confirmed', 'Unconfirmed', 'Not subscribed' ] )(
		'hides the action for an email-only subscriber whose status is %s',
		status => {
			// WP.com can only resolve an email to an account when the reader has an active email
			// subscription; these statuses mean they don't, so the comp would fail with
			// subscriber_not_confirmed.
			expect(
				canCompSubscriber(
					makeSubscriber( { email_address: 'pending@example.com', subscription_status: status } )
				)
			).toBe( false );
		}
	);

	it( 'allows a blocked email-only subscriber, whose subscription may still be active', () => {
		expect(
			canCompSubscriber(
				makeSubscriber( {
					email_address: 'bounced@example.com',
					subscription_status: 'Not sending',
					subscription_status_reason: 'bounced',
				} )
			)
		).toBe( true );
	} );

	it( 'hides the action when there is neither a user id nor an email address', () => {
		expect( canCompSubscriber( makeSubscriber( {} ) ) ).toBe( false );
	} );
} );
