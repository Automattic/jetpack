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
 * One round trip. The answer is WordPress.com's own, relayed with its status.
 *
 * @param fields - What to post with the action.
 * @return The answer.
 */
const request = async ( fields: Record< string, string > ): Promise< Answer > => {
	const { url, action, nonce } = JetpackComments.subscriptions;
	const failed: Answer = { ok: false, signedOut: false };

	try {
		const response = await fetch( url, {
			method: 'POST',
			credentials: 'same-origin',
			headers: nonce ? { 'X-WP-Nonce': nonce } : {},
			body: new URLSearchParams( { ...( action ? { action } : {} ), ...fields } ),
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

/**
 * What the reader is subscribed to.
 *
 * @param postId - The post the comment thread belongs to.
 * @param code   - The code a fresh sign-in is holding, for the site to redeem first.
 * @return The answer.
 */
export const readSubscriptions = ( postId: number, code: string | null ): Promise< Answer > =>
	request( { post_id: String( postId ), ...( code ? { code } : {} ) } );

/**
 * Flip one option. The answer is the whole state afterwards, so a change the
 * server declined leaves the control where it was.
 *
 * @param postId - The post the comment thread belongs to.
 * @param change - Which option, and what to set it to.
 * @param code   - The code a fresh sign-in is holding, for the site to redeem first.
 * @return The answer.
 */
export const changeSubscription = (
	postId: number,
	change: SubscriptionChange,
	code: string | null
): Promise< Answer > => {
	let value: string;

	if ( typeof change.value === 'boolean' ) {
		value = change.value ? '1' : '0';
	} else {
		value = change.value;
	}

	return request( {
		post_id: String( postId ),
		field: change.field,
		value,
		...( code ? { code } : {} ),
	} );
};
