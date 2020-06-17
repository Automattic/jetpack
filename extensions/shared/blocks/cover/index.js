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
import jetpackCoverBlockEdit from './edit';

import './editor.scss';

if ( isCurrentUserConnected() ) {
	// Take the control of MediaPlaceholder.
	addFilter( 'editor.MediaPlaceholder', 'jetpack/cover-edit-media-placeholder', coverEditMediaPlaceholder );

	// Extend Core CoverEditBlock.
	addFilter( 'editor.BlockEdit', 'jetpack/cover-block-edit', jetpackCoverBlockEdit );
}
