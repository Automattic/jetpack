import {
	getSubscribedAt,
	isOpenSubscriberRemoved,
} from '../_inc/subscribers/lib/subscriber-helpers';
import type { Subscriber, SubscriberDetails } from '../_inc/subscribers/data/types';

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

describe( 'getSubscribedAt', () => {
	it( 'prefers the wpcom date and pins the naive list timestamp to UTC', () => {
		const subscriber = makeSubscriber( {
			wpcom_date_subscribed: '2026-07-28 19:02:09',
			email_date_subscribed: '2020-01-01 00:00:00',
		} );
		expect( getSubscribedAt( subscriber ) ).toBe( '2026-07-28 19:02:09+00:00' );
	} );

	it( 'falls back to the email date for email-only subscribers', () => {
		const subscriber = makeSubscriber( { email_date_subscribed: '2026-06-12 08:30:00' } );
		expect( getSubscribedAt( subscriber ) ).toBe( '2026-06-12 08:30:00+00:00' );
	} );

	it( 'reads `date_subscribed` from the individual-subscriber payload', () => {
		// The detail panel rendered a blank date before this shape was handled: the individual
		// endpoint sends one `date_subscribed` rather than the list's wpcom_/email_ pair.
		const details: SubscriberDetails = {
			...makeSubscriber( {} ),
			date_subscribed: '2026-07-28T19:02:09+00:00',
		};
		expect( getSubscribedAt( details ) ).toBe( '2026-07-28T19:02:09+00:00' );
	} );

	it( 'does not append a second offset to an already-zoned date', () => {
		const zoned: SubscriberDetails = {
			...makeSubscriber( {} ),
			date_subscribed: '2026-07-28T16:02:09-03:00',
		};
		expect( getSubscribedAt( zoned ) ).toBe( '2026-07-28T16:02:09-03:00' );
		expect( Number.isNaN( new Date( getSubscribedAt( zoned ) ).getTime() ) ).toBe( false );
	} );

	it( 'treats a `Z` suffix as already zoned', () => {
		const utc: SubscriberDetails = {
			...makeSubscriber( {} ),
			date_subscribed: '2026-07-28T19:02:09Z',
		};
		expect( getSubscribedAt( utc ) ).toBe( '2026-07-28T19:02:09Z' );
	} );

	it( 'is empty when no date is present', () => {
		expect( getSubscribedAt( makeSubscriber( {} ) ) ).toBe( '' );
	} );
} );

describe( 'getSubscribedAt zero dates', () => {
	it( 'treats WP.com’s zero date as absent rather than rendering year 0000', () => {
		const zero: SubscriberDetails = {
			...makeSubscriber( {} ),
			date_subscribed: '0000-00-00T00:00:00+00:00',
		};
		expect( getSubscribedAt( zero ) ).toBe( '' );
	} );

	it( 'treats a naive zero date from a list row as absent too', () => {
		expect(
			getSubscribedAt( makeSubscriber( { wpcom_date_subscribed: '0000-00-00 00:00:00' } ) )
		).toBe( '' );
	} );
} );
