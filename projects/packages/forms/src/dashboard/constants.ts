/**
 * Shared dashboard constants (JS/TS).
 */
import { __ } from '@wordpress/i18n';

/**
 * Non-trash form statuses (matches WP core list behavior).
 *
 * Used for global counts and default "All" filters where trash should be excluded.
 */
export const NON_TRASH_FORM_STATUSES = 'publish,draft,pending,future,private';

/**
 * Get the translated label for a form post status.
 *
 * @param status - WordPress post status slug.
 * @return Translated status label.
 */
export function getFormStatusLabel( status: string ): string {
	switch ( status ) {
		case 'publish':
			return __( 'Published', 'jetpack-forms' );
		case 'draft':
			return __( 'Draft', 'jetpack-forms' );
		case 'pending':
			return __( 'Pending review', 'jetpack-forms' );
		case 'future':
			return __( 'Scheduled', 'jetpack-forms' );
		case 'private':
			return __( 'Private', 'jetpack-forms' );
		case 'trash':
			return __( 'Trash', 'jetpack-forms' );
		default:
			return status;
	}
}
