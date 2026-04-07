/**
 * Utility functions for generating form block labels in List View.
 */

import { __, _x, sprintf } from '@wordpress/i18n';

/**
 * Status labels for non-published forms.
 * Maps post status to human-readable labels.
 */
export const STATUS_LABELS = {
	draft: _x( 'Draft', 'form status', 'jetpack-forms' ),
	pending: _x( 'Pending', 'form status', 'jetpack-forms' ),
	future: _x( 'Scheduled', 'form status', 'jetpack-forms' ),
	private: _x( 'Private', 'form status', 'jetpack-forms' ),
	trash: _x( 'Trashed', 'form status', 'jetpack-forms' ),
};

/**
 * Default label used when no form title is available.
 */
export const DEFAULT_FORM_LABEL = __( 'Form', 'jetpack-forms' );

/**
 * Extract title text from various WordPress title formats.
 *
 * WordPress entity records may return title as:
 * - A string (when edited)
 * - An object with `rendered` property (from REST API)
 *
 * @param {string|object|undefined} rawTitle - The raw title value
 * @return {string} The extracted title text, or empty string if not found
 */
export function extractTitleText( rawTitle ) {
	if ( typeof rawTitle === 'string' ) {
		return rawTitle;
	}

	if ( rawTitle && typeof rawTitle === 'object' && 'rendered' in rawTitle ) {
		return rawTitle.rendered;
	}

	return '';
}

/**
 * Format the form label for display in List View.
 *
 * @param {object} options              - Formatting options
 * @param {string} options.title        - The form title
 * @param {string} options.status       - The form post status
 * @param {string} options.defaultLabel - Default label if title is empty
 * @return {string} The formatted label
 */
export function formatFormLabel( { title, status, defaultLabel = DEFAULT_FORM_LABEL } ) {
	const displayTitle = title || defaultLabel;

	if ( status === 'publish' ) {
		/* translators: %s: Form title, e.g., "Contact Us" */
		return sprintf( __( 'Form: %s', 'jetpack-forms' ), displayTitle );
	}

	const statusLabel = STATUS_LABELS[ status ] || status;

	/* translators: 1: Form title, 2: Form status (e.g., Draft, Scheduled) */
	return sprintf( __( 'Form: %1$s (%2$s)', 'jetpack-forms' ), displayTitle, statusLabel );
}
