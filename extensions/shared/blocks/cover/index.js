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
import './editor.scss';

// Take the control of MediaPlaceholder.
addFilter(
	'editor.MediaPlaceholder',
	'jetpack/cover-edit-media-placeholder',
	coverEditMediaPlaceholder
);
