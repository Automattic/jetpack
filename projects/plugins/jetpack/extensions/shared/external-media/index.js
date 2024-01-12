import { isCurrentUserConnected } from '@automattic/jetpack-shared-extension-utils';
import { useBlockEditContext } from '@wordpress/block-editor';
import { addFilter } from '@wordpress/hooks';
import { SOURCE_JETPACK_APP_MEDIA } from './constants'; // Move this import statement above the import statement for './media-button'
import MediaButton from './media-button';
import { addPexelsToMediaInserter, addGooglePhotosToMediaInserter } from './media-service';
import { mediaSources } from './sources';
import './editor.scss';

function insertExternalMediaBlocks( settings, name ) {
	if ( name !== 'core/image' ) {
		return settings;
	}
	// Check if the Jetpack App Media source is available.
	if ( ! window?.Jetpack_Editor_Initial_State?.available_media_sources?.jetpack_app_media ) {
		const index = mediaSources.findIndex(
			mediaSource => mediaSource.id === SOURCE_JETPACK_APP_MEDIA
		);
		if ( index > -1 ) {
			mediaSources.splice( index, 1 );
		}
	}
	return {
		...settings,
		keywords: [ ...settings.keywords, ...mediaSources.map( source => source.keyword ) ],
	};
}

if ( isCurrentUserConnected() && 'function' === typeof useBlockEditContext ) {
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

			if ( isAllowedBlock( name, render ) || isFeaturedImage( props ) ) {
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
