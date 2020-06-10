/**
 * External dependencies
 */

/**
 * WordPress dependencies
 */
import { addFilter } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import coverEditMediaPlaceholder from './cover-media-placeholder';
import isCurrentUserConnected from "../../is-current-user-connected";
import './editor.scss';
import coverMediaReplaceFlow from './cover-replace-control-button';

if ( isCurrentUserConnected() ) {
	// Take the control of MediaPlaceholder.
	addFilter(
		'editor.MediaPlaceholder',
		'jetpack/cover-edit-media-placeholder',
		coverEditMediaPlaceholder
	);

// Take the control of the Replace block button control.
	addFilter(
		'editor.MediaReplaceFlow',
		'jetpack/cover-edit-media-placeholder',
		coverMediaReplaceFlow
	);
}
