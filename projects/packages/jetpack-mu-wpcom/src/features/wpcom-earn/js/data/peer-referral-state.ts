export type PeerReferral =
	| { state: 'enabled'; link: string }
	/** Eligible, but the user has not turned referrals on yet. */
	| { state: 'available' }
	/** Not eligible: referrals need an annual paid plan. */
	| { state: 'unavailable' };

/**
 * Read the referral state from the link endpoint's answer, which decides eligibility per user.
 *
 * @param link        - The link, when the request succeeded.
 * @param error       - The request's error, when it failed.
 * @param error.code  - The error code, as the Atomic proxy relays it.
 * @param error.error - The error code, as v1.1 names it.
 * @return The state.
 */
export function toPeerReferral(
	link: unknown,
	error?: { code?: string; error?: string }
): PeerReferral {
	if ( ! error && typeof link === 'string' && link ) {
		return { state: 'enabled', link };
	}

	return ( error?.code ?? error?.error ) === 'peer_referral_link_not_enabled'
		? { state: 'available' }
		: { state: 'unavailable' };
}
