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
import coverEditMediaPlaceholder from '../media-placeholder';
import coverMediaReplaceFlow from './cover-replace-control-button';
import './editor.scss';

addFilter( 'editor.MediaPlaceholder', 'jetpack/cover-edit-media-placeholder', coverEditMediaPlaceholder );

// Take the control of the Replace block button control.
addFilter( 'editor.MediaReplaceFlow', 'jetpack/cover-media-replace-flow', coverMediaReplaceFlow );
