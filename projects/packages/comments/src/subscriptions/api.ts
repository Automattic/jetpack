import type { SubscriptionChange, SubscriptionState } from '../shared/types';

export const NO_SUBSCRIPTION: SubscriptionState = {
	email: { send_posts: false, send_comments: false, post_delivery_frequency: 'daily' },
	notification: { send_posts: false },
};

const SIGN_IN_LOST = [
	'not_signed_in',
	'code_expired',
	'code_used',
	'invalid_code',
	'blog_mismatch',
];

export type Answer = {
	state?: SubscriptionState | null;
	ok: boolean;
	signedOut: boolean;
};

/**
 * Read the reader's subscriptions, after one change if given.
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
