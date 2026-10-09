import apiFetch from '@wordpress/api-fetch';
import { __, sprintf } from '@wordpress/i18n';
import type { BlockedRequest } from './types';

export const FIREWALL_PATH = '/jetpack/v4/protect-dashboard/firewall';

export type TestOutcome = 'blocked' | 'silent' | 'not-blocked';

/**
 * What the test request's response says about the firewall.
 *
 * @param status    - The response status.
 * @param wafHeader - The `X-JetpackWAF-Blocked` header, which the firewall sends whenever it blocks.
 * @return The outcome; a 403 without the header came from something else, such as the host.
 */
export function getTestOutcome( status: number, wafHeader: string | null ): TestOutcome {
	if ( ! wafHeader ) {
		return 'not-blocked';
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
 * Request the one-time URL the firewall always blocks, the way a visitor would.
 *
 * @return The outcome.
 */
export async function runFirewallTest(): Promise< TestOutcome > {
	const { url } = await apiFetch< { url: string } >( {
		path: `${ FIREWALL_PATH }/test`,
		method: 'POST',
	} );
	const response = await fetch( url, { credentials: 'omit', cache: 'no-store' } );
	return getTestOutcome( response.status, response.headers.get( 'X-JetpackWAF-Blocked' ) );
}
