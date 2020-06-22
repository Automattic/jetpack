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
import isCurrentUserConnected from '../../is-current-user-connected';
import './editor.scss';

if ( isCurrentUserConnected() ) {
	// Take the control of MediaPlaceholder.
	addFilter(
		'editor.MediaPlaceholder',
		'jetpack/cover-edit-media-placeholder',
		coverEditMediaPlaceholder
	);
}
