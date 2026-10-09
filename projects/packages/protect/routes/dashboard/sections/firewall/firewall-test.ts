import apiFetch from '@wordpress/api-fetch';
import { __, sprintf } from '@wordpress/i18n';
import type { BlockedRequest } from './types';

export const FIREWALL_PATH = '/jetpack/v4/protect-dashboard/firewall';

/** Matches `Automattic\\Jetpack\\Waf\\Waf_Self_Check::RULE_ID`. */
export const SELF_CHECK_RULE_ID = -2;

export type TestOutcome = 'blocked' | 'silent' | 'not-blocked' | 'off';

export type TestResult = {
	outcome: TestOutcome;
	/** The one-time URL the browser requested. */
	url: string;
	status: number;
	statusText: string;
	/** The `X-JetpackWAF-Blocked` header, which the firewall sends whenever it blocks. */
	wafHeader: string | null;
};

/**
 * What the test request's response says about the firewall.
 *
 * @param status    - The response status.
 * @param wafHeader - The `X-JetpackWAF-Blocked` header.
 * @param active    - Whether the firewall is on.
 * @return The outcome; a 403 without the header came from something else, such as the host.
 */
export function getTestOutcome(
	status: number,
	wafHeader: string | null,
	active: boolean
): TestOutcome {
	if ( ! wafHeader ) {
		return active ? 'not-blocked' : 'off';
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
	if ( block.reason === 'firewall test' ) {
		return __( 'Firewall test', 'jetpack-protect-pkg' );
	}
	if ( block.reason === 'ip block list' ) {
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
 * @param active - Whether the firewall is on.
 * @return What happened.
 */
export async function runFirewallTest( active: boolean ): Promise< TestResult > {
	const { url } = await apiFetch< { url: string } >( {
		path: `${ FIREWALL_PATH }/test`,
		method: 'POST',
	} );
	const response = await fetch( url, { credentials: 'omit', cache: 'no-store' } );
	const wafHeader = response.headers.get( 'X-JetpackWAF-Blocked' );
	return {
		outcome: getTestOutcome( response.status, wafHeader, active ),
		url,
		status: response.status,
		statusText: response.statusText,
		wafHeader,
	};
}
