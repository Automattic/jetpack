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
	/** The sign-in code went with this request and is spent, whatever else happened. */
	redeemed: boolean;
};

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

	for ( const [ name, value ] of Object.entries( change ?? {} ) ) {
		fields[ name ] = typeof value === 'boolean' ? String( Number( value ) ) : value;
	}

	const failed: Answer = { ok: false, signedOut: false, redeemed: false };

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
			redeemed?: boolean;
		} & Partial< SubscriptionState >;
		const redeemed = body.redeemed === true;

		if ( ! response.ok ) {
			return { ...failed, redeemed, signedOut: SIGN_IN_LOST.includes( body.code ?? '' ) };
		}

		if ( body.available === false ) {
			return { state: null, ok: true, signedOut: false, redeemed };
		}

		if ( ! body.email || ! body.notification ) {
			return { ...failed, redeemed };
		}

		return {
			state: { email: body.email, notification: body.notification },
			ok: true,
			signedOut: false,
			redeemed,
		};
	} catch {
		return failed;
	}
};
