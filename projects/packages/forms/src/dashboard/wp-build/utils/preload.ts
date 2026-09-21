/**
 * WordPress dependencies
 */
import { resolveSelect } from '@wordpress/data';
/**
 * Internal dependencies
 */
import { STORE_NAME as FORM_RESPONSES_STORE_NAME } from '../../store/index.js';

/**
 * Preload global inbox/spam/trash counts.
 *
 * Warms the `FORM_RESPONSES` store cache the responses list reads its totals from.
 */
export async function preloadGlobalInboxCounts(): Promise< void > {
	// Pass an explicit empty object so @wordpress/data resolver deduplication
	// matches the other call-site (useInboxData), which also passes `{}`. Without
	// this, getCounts() → args [] vs getCounts({}) → args [{}] are treated as
	// different resolutions, causing a duplicate network request.
	await resolveSelect( FORM_RESPONSES_STORE_NAME ).getCounts( {} );
}
