import { getAdminUrl } from '@automattic/jetpack-script-data';
import { addQueryArgs } from '@wordpress/url';

declare global {
	interface Window {
		jpFormsBlocks?: {
			defaults?: {
				formsResponsesUrl?: string;
			};
		};
	}
}

/**
 * Build the wp-admin URL for the Forms responses inbox.
 *
 * @return Admin URL for all responses.
 */
export function getAllResponsesUrl(): string {
	const baseUrl =
		window.jpFormsBlocks?.defaults?.formsResponsesUrl ||
		getAdminUrl( 'admin.php?page=jetpack-forms-responses-wp-admin' ) ||
		'/wp-admin/admin.php?page=jetpack-forms-responses-wp-admin';

	return addQueryArgs( baseUrl, { p: '/responses/inbox' } );
}
