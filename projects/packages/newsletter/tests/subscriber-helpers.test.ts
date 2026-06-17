import {
	hasNoSubscribersOtherThanOwner,
	isOpenSubscriberRemoved,
} from '../_inc/subscribers/lib/subscriber-helpers';
import type { Subscriber } from '../_inc/subscribers/data/types';

/**
 * Build a minimal subscriber row for the matcher tests.
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

describe( 'isOpenSubscriberRemoved', () => {
	it( 'is false when the inspector is closed (no open identity)', () => {
		const removed = [ makeSubscriber( { email_subscription_id: 123, user_id: 45 } ) ];
		expect( isOpenSubscriberRemoved( {}, removed ) ).toBe( false );
	} );

	it( 'is false when nothing was removed', () => {
		expect( isOpenSubscriberRemoved( { subscriptionId: 123, userId: 45 }, [] ) ).toBe( false );
	} );

	it( 'matches on the email subscription id', () => {
		const removed = [ makeSubscriber( { email_subscription_id: 123 } ) ];
		expect( isOpenSubscriberRemoved( { subscriptionId: 123 }, removed ) ).toBe( true );
	} );

	it( 'matches on the wpcom subscription id when there is no email subscription id', () => {
		const removed = [ makeSubscriber( { wpcom_subscription_id: 999 } ) ];
		expect( isOpenSubscriberRemoved( { subscriptionId: 999 }, removed ) ).toBe( true );
	} );

	it( 'matches on the user id', () => {
		const removed = [ makeSubscriber( { user_id: 45 } ) ];
		expect( isOpenSubscriberRemoved( { userId: 45 }, removed ) ).toBe( true );
	} );

	it( 'does not match an unrelated removed subscriber', () => {
		const removed = [ makeSubscriber( { email_subscription_id: 1, user_id: 2 } ) ];
		expect( isOpenSubscriberRemoved( { subscriptionId: 123, userId: 45 }, removed ) ).toBe( false );
	} );

	it( 'finds the open subscriber among a bulk removal', () => {
		const removed = [
			makeSubscriber( { email_subscription_id: 1, user_id: 2 } ),
			makeSubscriber( { email_subscription_id: 123, user_id: 45 } ),
		];
		expect( isOpenSubscriberRemoved( { subscriptionId: 123, userId: 45 }, removed ) ).toBe( true );
	} );

	it( 'does not match a zero user id against an email-only open identity', () => {
		// Email-only rows carry `user_id: 0`; an inspector opened by user id must not be
		// closed by removing an unrelated email-only subscriber.
		const removed = [ makeSubscriber( { user_id: 0, email_subscription_id: 1 } ) ];
		expect( isOpenSubscriberRemoved( { userId: 0 }, removed ) ).toBe( false );
	} );
} );

describe( 'hasNoSubscribersOtherThanOwner', () => {
	it( 'is true when there are no subscribers at all', () => {
		expect( hasNoSubscribersOtherThanOwner( 0, false ) ).toBe( true );
		// Owner flag is irrelevant when the total is zero.
		expect( hasNoSubscribersOtherThanOwner( 0, true ) ).toBe( true );
	} );

	it( 'is true when the only subscriber is the site owner', () => {
		expect( hasNoSubscribersOtherThanOwner( 1, true ) ).toBe( true );
	} );

	it( 'is false when the single subscriber is not the owner', () => {
		expect( hasNoSubscribersOtherThanOwner( 1, false ) ).toBe( false );
	} );

	it( 'is false once there is more than one subscriber, owner included', () => {
		expect( hasNoSubscribersOtherThanOwner( 2, true ) ).toBe( false );
		expect( hasNoSubscribersOtherThanOwner( 5, false ) ).toBe( false );
	} );
} );
