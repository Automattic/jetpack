/**
 * WordPress dependencies
 */
import { addFilter } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import isCurrentUserConnected from '../is-current-user-connected';
import MediaButton from './media-button';
import { mediaSources } from './sources';
import './editor.scss';

function insertExternalMediaBlocks( settings, name ) {
	if ( name !== 'core/image' ) {
		return settings;
	}

	return {
		...settings,
		keywords: [ ...settings.keywords, ...mediaSources.map( source => source.keyword ) ],
	};
}

if ( isCurrentUserConnected() ) {
	// Register the new 'browse media' button.
	addFilter(
		'editor.MediaUpload',
		'external-media/replace-media-upload',
		OriginalComponent => props => (
			<OriginalComponent
				{ ...props }
				render={ button => <MediaButton { ...button } mediaProps={ props } /> }
			/>
		),
		11
	);

	// Register the individual external media blocks.
	addFilter(
		'blocks.registerBlockType',
		'external-media/individual-blocks',
		insertExternalMediaBlocks
	);
}
