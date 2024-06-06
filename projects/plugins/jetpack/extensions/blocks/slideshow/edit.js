import { getBlockIconComponent } from '@automattic/jetpack-shared-extension-utils';
import { isBlobURL } from '@wordpress/blob';
import {
	MediaPlaceholder,
	BlockControls,
	InspectorControls,
	useBlockProps,
} from '@wordpress/block-editor';
import { DropZone, FormFileUpload, withNotices } from '@wordpress/components';
import { compose } from '@wordpress/compose';
import { withDispatch, withSelect } from '@wordpress/data';
import { mediaUpload } from '@wordpress/editor';
import { useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { get, map, pick } from 'lodash';
import metadata from './block.json';
import { PanelControls, ToolbarControls } from './controls';
import Slideshow from './slideshow';

import './editor.scss';

const ALLOWED_MEDIA_TYPES = [ 'image' ];

export const pickRelevantMediaFiles = ( image, sizeSlug ) => {
	const imageProps = pick( image, [ 'alt', 'id', 'link', 'caption' ] );
	imageProps.url =
		get( image, [ 'sizes', sizeSlug, 'url' ] ) ||
		get( image, [ 'media_details', 'sizes', sizeSlug, 'source_url' ] ) ||
		image.url;
	return imageProps;
};

export const SlideshowEdit = ( {
	attributes,
	setAttributes,
	className,
	isSelected,
	noticeOperations,
	noticeUI,
	lockPostSaving,
	unlockPostSaving,
	imageSizes,
	resizedImages,
} ) => {
	const { align, autoplay, delay, effect, images, sizeSlug, ids } = attributes;

	const blockProps = useBlockProps( {
		className: className,
	} );

	const setImages = imgs => {
		setAttributes( {
			images: imgs,
			ids: imgs.map( ( { id } ) => parseInt( id, 10 ) ),
		} );
	};

	const onSelectImages = imgs =>
		setImages( imgs.map( image => pickRelevantMediaFiles( image, sizeSlug ) ) );

	const addFiles = files => {
		const lockName = 'slideshowBlockLock';

		lockPostSaving( lockName );
		mediaUpload( {
			allowedTypes: ALLOWED_MEDIA_TYPES,
			filesList: files,
			onFileChange: imgs => {
				const imagesNormalized = imgs.map( image => pickRelevantMediaFiles( image, sizeSlug ) );

				setImages( [ ...( images || [] ), ...imagesNormalized ] );

				if ( ! imagesNormalized.every( image => isBlobURL( image.url ) ) ) {
					unlockPostSaving( lockName );
				}
			},
			onError: noticeOperations.createErrorNotice,
		} );
	};

	const uploadFromFiles = event => addFiles( event.target.files );

	const getImageSizeOptions = () =>
		map( imageSizes, ( { name, slug } ) => ( { value: slug, label: name } ) );

	const updateImagesSize = slug => {
		const updatedImages = images.map( image => {
			const resizedImage = resizedImages.find(
				( { id } ) => parseInt( id, 10 ) === parseInt( image.id, 10 )
			);
			const url = get( resizedImage, [ 'sizes', slug, 'source_url' ] );
			return {
				...image,
				...( url && { url } ),
			};
		} );

		setImages( updatedImages );
		setAttributes( { sizeSlug: slug } );
	};

	useEffect( () => {
		if ( ! sizeSlug ) {
			// To improve the performance, we use large size images by default except for blocks inserted before the
			// image size attribute was added, since they were loading full size images. The presence or lack of images
			// in a block determines when it has been inserted (before or after we added the image size attribute),
			// given that now it is not possible to have a block with images and no size.
			setAttributes( { sizeSlug: ids.length ? 'full' : 'large' } );
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [] );

	let content;

	if ( images.length === 0 ) {
		content = (
			<MediaPlaceholder
				icon={ getBlockIconComponent( metadata ) }
				labels={ {
					title: __( 'Slideshow', 'jetpack' ),
					instructions: __(
						'Drag images, upload new ones or select files from your library.',
						'jetpack'
					),
				} }
				onSelect={ onSelectImages }
				accept="image/*"
				allowedTypes={ ALLOWED_MEDIA_TYPES }
				multiple
				notices={ noticeUI }
				onError={ noticeOperations.createErrorNotice }
			/>
		);
	} else {
		content = (
			<>
				{ noticeUI }
				<Slideshow
					align={ align }
					autoplay={ autoplay }
					delay={ delay }
					effect={ effect }
					images={ images }
					onError={ noticeOperations.createErrorNotice }
				/>
				<DropZone onFilesDrop={ addFiles } />
				{ isSelected && (
					<div className="wp-block-jetpack-slideshow__add-item">
						<FormFileUpload
							multiple
							className="wp-block-jetpack-slideshow__add-item-button"
							onChange={ uploadFromFiles }
							accept="image/*"
							icon="insert"
						>
							{ __( 'Upload an image', 'jetpack' ) }
						</FormFileUpload>
					</div>
				) }
			</>
		);
	}

	return (
		<div { ...blockProps }>
			<InspectorControls>
				<PanelControls
					attributes={ attributes }
					imageSizeOptions={ getImageSizeOptions() }
					onChangeImageSize={ updateImagesSize }
					setAttributes={ setAttributes }
				/>
			</InspectorControls>
			<BlockControls>
				<ToolbarControls
					allowedMediaTypes={ ALLOWED_MEDIA_TYPES }
					attributes={ attributes }
					onSelectImages={ onSelectImages }
				/>
			</BlockControls>
			{ content }
		</div>
	);
};

export default compose(
	withSelect( ( select, props ) => {
		const imageSizes = select( 'core/editor' ).getEditorSettings().imageSizes;
		const resizedImages = props.attributes.ids.reduce( ( currentResizedImages, id ) => {
			const image = select( 'core' ).getMedia( id );
			const sizes = get( image, [ 'media_details', 'sizes' ] );
			return [ ...currentResizedImages, { id, sizes } ];
		}, [] );
		return {
			imageSizes,
			resizedImages,
		};
	} ),
	withDispatch( dispatch => {
		const { lockPostSaving, unlockPostSaving } = dispatch( 'core/editor' );
		return {
			lockPostSaving,
			unlockPostSaving,
		};
	} ),
	withNotices
)( SlideshowEdit );
