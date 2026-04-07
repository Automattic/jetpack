/**
 * Utility functions for form editor plugins.
 */

import { addQueryArgs } from '@wordpress/url';
import '../../types';

/**
 * Get the responses URL for the current form.
 *
 * @param postId - The post ID of the form.
 * @return The URL to view form responses.
 */
export const getResponsesUrl = ( postId: number ): string => {
	const baseUrl =
		window.jpFormsBlocks?.defaults?.formsResponsesUrl ||
		'/wp-admin/admin.php?page=jetpack-forms-responses-wp-admin';
	// Navigate to the specific form's responses
	return addQueryArgs( baseUrl, { p: `/responses/inbox?sourceId=${ postId }` } );
};
