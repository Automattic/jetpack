/**
 * The browser side of subscriptions: the site's route, which relays to
 * WordPress.com on the reader's behalf. Same-origin, so it carries the site
 * login or the passport, whichever the reader holds.
 */

import type { SubscriptionChange, SubscriptionState } from '../shared/types';

// What a reader with no subscription sees. Daily rather than instantly is what
// Verbum showed on the greyed-out control.
export const NO_SUBSCRIPTION: SubscriptionState = {
	email: { send_posts: false, send_comments: false, post_delivery_frequency: 'daily' },
	notification: { send_posts: false },
};

// Errors that mean the sign-in behind the request is gone.
const SIGN_IN_LOST = [
	'not_signed_in',
	'code_expired',
	'code_used',
	'invalid_code',
	'blog_mismatch',
];

export type Answer = {
	/** The state afterwards, or null when there is no email to subscribe. Absent on failure. */
	state?: SubscriptionState | null;
	/** Whether the request went through, so a code sent with it is spent. */
	ok: boolean;
	/** Whether the reader should be shown as signed out. */
	signedOut: boolean;
};

/**
 * One round trip: what the reader is subscribed to, after one change if given.
 * The answer is WordPress.com's own, relayed with its status, so a change the
 * server declined leaves the control where it was.
 *
 * @param postId - The post the comment thread belongs to.
 * @param code   - The code a fresh sign-in is holding, for the site to redeem first.
 * @param change - Which option to set, and to what.
 * @return The answer.
 */
export const fetchSubscriptions = async (
	postId: number,
	code: string | null,
	change?: SubscriptionChange
): Promise< Answer > => {
	const { url, action, nonce } = JetpackComments.subscriptions;
	const fields: Record< string, string > = { post_id: String( postId ) };

	if ( action ) {
		fields.action = action;
	}

	if ( code ) {
		fields.code = code;
	}

	if ( change ) {
		fields.field = change.field;
		fields.value =
			typeof change.value === 'boolean' ? String( Number( change.value ) ) : change.value;
	}

	const failed: Answer = { ok: false, signedOut: false };

	try {
		const response = await fetch( url, {
			method: 'POST',
			credentials: 'same-origin',
			headers: nonce ? { 'X-WP-Nonce': nonce } : {},
			body: new URLSearchParams( fields ),
		} );

		const body = ( await response.json() ) as {
			code?: string;
			available?: boolean;
		} & Partial< SubscriptionState >;

		if ( ! response.ok ) {
			return { ...failed, signedOut: SIGN_IN_LOST.includes( body.code ?? '' ) };
		}

		if ( body.available === false ) {
			return { state: null, ok: true, signedOut: false };
		}

		if ( ! body.email || ! body.notification ) {
			return failed;
		}

		return {
			state: { email: body.email, notification: body.notification },
			ok: true,
			signedOut: false,
		};
	} catch {
		return failed;
	}
};
