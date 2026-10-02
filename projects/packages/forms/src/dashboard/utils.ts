import { addQueryArgs } from '@wordpress/url';
import { FORM_POST_TYPE } from '../blocks/shared/util/constants.js';

/**
 * Get the edit URL for a form post.
 *
 * @param formId   - The form post ID.
 * @param adminUrl - The wp-admin base URL (e.g. "https://example.com/wp-admin/").
 * @return           The edit URL.
 */
export function getFormEditUrl( formId: number, adminUrl?: string ): string {
	return `${ adminUrl ?? '' }post.php?post=${ formId }&action=edit`;
}

/**
 * Get the URL that opens the block editor on a brand new form.
 *
 * @param formTitle - Optional title to seed the new post with.
 * @param adminUrl  - The wp-admin base URL (e.g. "https://example.com/wp-admin/").
 * @return            The editor URL.
 */
export function getNewFormEditorUrl( formTitle?: string, adminUrl?: string ): string {
	return addQueryArgs( `${ adminUrl ?? '' }post-new.php`, {
		post_type: FORM_POST_TYPE,
		post_title: formTitle?.trim() || undefined,
	} );
}
