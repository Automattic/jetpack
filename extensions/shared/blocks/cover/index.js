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
import coverMediaReplaceFlow from './cover-replace-control-button';
import jetpackCoverBlockEdit from './edit';
import { isUpgradable } from './utils';
import './editor.scss';

const addVideoUploadPlanCheck = ( settings, name ) => {
	if ( ! settings.isDeprecation && isUpgradable( name ) ) {
		// Take the control of MediaPlaceholder.
		addFilter(
			'editor.MediaPlaceholder',
			'jetpack/cover-edit-media-placeholder',
			coverEditMediaPlaceholder
		);

		// Take the control of the Replace block button control.
		addFilter(
			'editor.MediaReplaceFlow',
			'jetpack/cover-media-replace-flow',
			coverMediaReplaceFlow
		);

		// Extend Core CoverEditBlock.
		addFilter( 'editor.BlockEdit', 'jetpack/cover-block-edit', jetpackCoverBlockEdit );
	}

	return settings;
};
addFilter( 'blocks.registerBlockType', 'core/cover', addVideoUploadPlanCheck );
