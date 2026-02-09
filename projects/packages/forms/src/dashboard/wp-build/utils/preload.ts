/**
 * WordPress dependencies
 */
import { resolveSelect } from '@wordpress/data';
/**
 * Internal dependencies
 */
import { NON_TRASH_FORM_STATUSES } from '../../constants.ts';
import { STORE_NAME as FORM_RESPONSES_STORE_NAME } from '../../store/index.js';

/**
 * Preload global inbox/spam/trash counts.
 *
 * This warms the `FORM_RESPONSES` store cache used by the wp-build header tabs.
 */
export async function preloadGlobalInboxCounts(): Promise< void > {
	await resolveSelect( FORM_RESPONSES_STORE_NAME ).getCounts();
}

/**
 * Preload global non-trash forms count.
 *
 * This warms the core-data cache so `useFormsData( 1, 1, '', statuses ).totalItems`
 * can resolve quickly (we only need totals, not records).
 */
export async function preloadGlobalNonTrashFormsCount(): Promise< void > {
	await resolveSelect( 'core' ).getEntityRecords( 'postType', 'jetpack_form', {
		context: 'edit',
		jetpack_forms_context: 'dashboard',
		order: 'desc',
		orderby: 'modified',
		page: 1,
		per_page: 1,
		status: NON_TRASH_FORM_STATUSES,
	} );
}

/**
 * Preload global data needed for the wp-build "Forms / Responses" header tab counts.
 */
export async function preloadGlobalTabCounts(): Promise< void > {
	await Promise.all( [ preloadGlobalInboxCounts(), preloadGlobalNonTrashFormsCount() ] );
}
