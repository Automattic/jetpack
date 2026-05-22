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
 * Build the wp-build Forms dashboard URL that opens a single response.
 *
 * @param responseId - Feedback post ID.
 * @return Admin URL with route path and response selection.
 */
export function getResponseDetailUrl( responseId: number ): string {
	const baseUrl =
		window.jpFormsBlocks?.defaults?.formsResponsesUrl ||
		'/wp-admin/admin.php?page=jetpack-forms-responses-wp-admin';
	const path = `/responses/inbox?responseIds=["${ responseId }"]`;

	return addQueryArgs( baseUrl, { p: path } );
}
