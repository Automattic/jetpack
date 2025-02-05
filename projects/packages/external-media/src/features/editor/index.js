import { isUserConnected } from '@automattic/jetpack-shared-extension-utils';
import { useBlockEditContext } from '@wordpress/block-editor';
import { addFilter } from '@wordpress/hooks';
import {
	addPexelsToMediaInserter,
	addGooglePhotosToMediaInserter,
	MediaButton,
	mediaSources,
} from '../../shared';
import './editor.scss';

/**
 * Insert external media blocks
 * @param {object} settings - The block settings.
 * @param {string} name     - The block name.
 * @return {object} - The inserted block settings.
 */
function insertExternalMediaBlocks( settings, name ) {
	if ( name !== 'core/image' ) {
		return settings;
	}

	return {
		...settings,
		keywords: [ ...settings.keywords, ...mediaSources.map( source => source.keyword ) ],
	};
}

if ( isUserConnected() && 'function' === typeof useBlockEditContext ) {
	addPexelsToMediaInserter();
	addGooglePhotosToMediaInserter();

	const isFeaturedImage = props =>
		props.unstableFeaturedImageFlow ||
		( props.modalClass && props.modalClass.indexOf( 'featured-image' ) > -1 );

	const isAllowedBlock = ( name, render ) => {
		const allowedBlocks = [
			'core/cover',
			'core/image',
			'core/gallery',
			'core/media-text',
			'jetpack/image-compare',
			'jetpack/slideshow',
			'jetpack/story',
			'jetpack/tiled-gallery',
			'videopress/video',
		];

		return allowedBlocks.indexOf( name ) > -1 && render.toString().indexOf( 'coblocks' ) === -1;
	};

	// Register the new 'browse media' button.
	addFilter(
		'editor.MediaUpload',
		'external-media/replace-media-upload',
		OriginalComponent => props => {
			const { name } = useBlockEditContext();
			let { render } = props;

			if (
				( props?.mode === 'browse' && isAllowedBlock( name, render ) ) ||
				isFeaturedImage( props )
			) {
				const { allowedTypes, gallery = false, value = [] } = props;

				// Only replace button for components that expect images, except existing galleries.
				if ( allowedTypes.indexOf( 'image' ) > -1 && ! ( gallery && value.length > 0 ) ) {
					render = button => <MediaButton { ...button } mediaProps={ props } />;
				}
			}

			return <OriginalComponent { ...props } render={ render } />;
		},
		100
	);

	// Register the individual external media blocks.
	addFilter(
		'blocks.registerBlockType',
		'external-media/individual-blocks',
		insertExternalMediaBlocks
	);
}
