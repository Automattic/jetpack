/**
 * The browser side of subscriptions: the site's admin-ajax action, which asks
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
	/** Whether the site turned the sign-in's code into a passport on this request. */
	passport: boolean;
	/** Whether the reader should be shown as signed out. */
	signedOut: boolean;
};

const request = async ( fields: Record< string, string > ): Promise< Answer > => {
	const { url, action } = JetpackComments.subscriptions;
	const failed: Answer = { passport: false, signedOut: false };

	try {
		const response = await fetch( url, {
			method: 'POST',
			credentials: 'same-origin',
			body: new URLSearchParams( { action, ...fields } ),
		} );

		const json = ( await response.json() ) as {
			success?: boolean;
			data?: {
				available?: boolean;
				passport?: boolean;
				code?: string;
			} & Partial< SubscriptionState >;
		};

		if ( ! json.data ) {
			return failed;
		}

		if ( ! json.success ) {
			return { ...failed, signedOut: SIGN_IN_LOST.includes( json.data.code ?? '' ) };
		}

		const passport = json.data.passport === true;

		if ( json.data.available === false ) {
			return { state: null, passport, signedOut: false };
		}

		if ( ! json.data.email || ! json.data.notification ) {
			return failed;
		}

		return {
			state: { email: json.data.email, notification: json.data.notification },
			passport,
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
