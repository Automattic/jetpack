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
 * This warms the `FORM_RESPONSES` store cache used by the wp-build header tabs.
 */
export async function preloadGlobalInboxCounts(): Promise< void > {
	// Pass an explicit empty object so @wordpress/data resolver deduplication
	// matches other call-sites (useInboxData, DataViewsHeaderRow) that also
	// pass `{}`. Without this, getCounts() → args [] vs getCounts({}) → args [{}]
	// are treated as different resolutions, causing a duplicate network request.
	await resolveSelect( FORM_RESPONSES_STORE_NAME ).getCounts( {} );
}

/**
 * Preload global data needed for the wp-build "Forms / Responses" header tab counts.
 */
export async function preloadGlobalTabCounts(): Promise< void > {
	await preloadGlobalInboxCounts();
}
