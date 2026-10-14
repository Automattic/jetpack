import apiFetch from '@wordpress/api-fetch';
import { __, sprintf } from '@wordpress/i18n';
import type { BlockedRequest, FirewallTestResponse } from './types';

export const FIREWALL_PATH = '/jetpack/v4/protect-dashboard/firewall';

/** Matches `Automattic\\Jetpack\\Waf\\Waf_Self_Check::RULE_ID`. */
export const SELF_CHECK_RULE_ID = -2;

/** The rule ID the firewall logs for its IP block list. */
export const IP_BLOCK_LIST_RULE_ID = -1;

/** Thrown by `runFirewallTest()` when the site's address is on another origin than the dashboard. */
export class CrossOriginError extends Error {}

/** Thrown by `runFirewallTest()` when the site takes longer than `TIMEOUT` to answer. */
export class TimeoutError extends Error {}

// Well inside the token's 60 seconds; a later answer would look like the firewall isn't running.
const TIMEOUT = 15000;

/** The header the firewall sends whenever it blocks. */
export const BLOCKED_HEADER = 'X-JetpackWAF-Blocked';

/** Matches `Automattic\\Jetpack\\Waf\\Waf_Self_Check::ALLOWED_HEADER`. */
export const ALLOWED_HEADER = 'X-JetpackWAF-Test-Allowed';

export type TestOutcome =
	'blocked' | 'blocked-while-off' | 'silent' | 'allowed' | 'not-blocked' | 'off';

export type TestResult = {
	outcome: TestOutcome;
	/** The one-time URL the browser requested. */
	url: string;
	status: number;
	statusText: string;
	/** The `X-JetpackWAF-Blocked` header, which the firewall sends whenever it blocks. */
	wafHeader: string | null;
	/** The header the firewall sends when it lets the test through for the IP allow list. */
	allowedHeader: string | null;
};

/**
 * What the test request's response says about the firewall.
 *
 * @param status        - The response status.
 * @param wafHeader     - The `X-JetpackWAF-Blocked` header.
 * @param allowedHeader - The header sent when the IP allow list let the test through.
 * @param active        - Whether the firewall is on.
 * @return The outcome; a 403 without the header came from something else, such as the host.
 */
export function getTestOutcome(
	status: number,
	wafHeader: string | null,
	allowedHeader: string | null,
	active: boolean
): TestOutcome {
	if ( allowedHeader ) {
		return 'allowed';
	}
	if ( ! wafHeader ) {
		return active ? 'not-blocked' : 'off';
	}
	// A standalone-mode bootstrap keeps answering after the firewall is turned off.
	if ( ! active ) {
		return 'blocked-while-off';
	}
	return status === 403 ? 'blocked' : 'silent';
}

/**
 * A blocked request's description, for the recent blocks list.
 *
 * @param block - The blocked request.
 * @return The label.
 */
export function getBlockLabel( block: Pick< BlockedRequest, 'ruleId' | 'reason' > ): string {
	if ( block.ruleId === SELF_CHECK_RULE_ID ) {
		return __( 'Firewall test', 'jetpack-protect-pkg' );
	}
	if ( block.ruleId === IP_BLOCK_LIST_RULE_ID ) {
		return __( 'Blocked IP address', 'jetpack-protect-pkg' );
	}
	return (
		block.reason ||
		/* translators: %d is a firewall rule's ID. */
		sprintf( __( 'Rule %d', 'jetpack-protect-pkg' ), block.ruleId )
	);
}

/**
 * Request the one-time URL the firewall always blocks, the way a logged-out visitor would.
 *
 * @param  active - Whether the firewall is on.
 * @return What happened.
 * @throws {CrossOriginError} When the site can't be requested from this page.
 * @throws {TimeoutError}     When the site doesn't answer in time.
 */
export async function runFirewallTest( active: boolean ): Promise< TestResult > {
	const controller = new AbortController();
	// eslint-disable-next-line @wordpress/no-unused-vars-before-return -- Cleared in `finally`, so it's used on every path.
	const timer = setTimeout( () => controller.abort(), TIMEOUT );
	try {
		const { url } = await apiFetch< FirewallTestResponse >( {
			path: `${ FIREWALL_PATH }/test`,
			method: 'POST',
			signal: controller.signal,
		} );
		// Another origin's response headers can't be read, so the result would be a guess.
		if ( new URL( url ).origin !== window.location.origin ) {
			throw new CrossOriginError();
		}
		const response = await fetch( url, {
			credentials: 'omit',
			cache: 'no-store',
			signal: controller.signal,
		} );
		const wafHeader = response.headers.get( BLOCKED_HEADER );
		const allowedHeader = response.headers.get( ALLOWED_HEADER );
		return {
			outcome: getTestOutcome( response.status, wafHeader, allowedHeader, active ),
			url,
			status: response.status,
			statusText: response.statusText,
			wafHeader,
			allowedHeader,
		};
	} catch ( e ) {
		throw controller.signal.aborted ? new TimeoutError() : e;
	} finally {
		clearTimeout( timer );
	}
}
