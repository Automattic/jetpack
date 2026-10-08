import { getBlockIconComponent } from '@automattic/jetpack-shared-extension-utils';
import { createBlobURL, revokeBlobURL } from '@wordpress/blob';
import {
	MediaPlaceholder,
	store as blockEditorStore,
	useBlockProps,
} from '@wordpress/block-editor';
import { DropZone, FormFileUpload, withNotices } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { pick } from 'lodash';
import { getActiveStyleName } from '../../shared/block-styles';
import metadata from './block.json';
import { ALLOWED_MEDIA_TYPES, LAYOUT_STYLES } from './constants';
import { TiledGalleryBlockControls, TiledGalleryInspectorControls } from './controls';
import Layout from './layout';
import { hasSameColumnShape } from './layout/utils';

const DEFAULT_COLUMNS_COUNT = 3;

export function defaultColumnsNumber( attributes ) {
	return attributes.images.length > 0
		? Math.min( DEFAULT_COLUMNS_COUNT, attributes.images.length )
		: DEFAULT_COLUMNS_COUNT;
}

export const pickRelevantMediaFiles = image => {
	const imageProps = pick( image, [ [ 'alt' ], [ 'id' ], [ 'link' ] ] );
	imageProps.url =
		image?.sizes?.large?.url || image?.media_details?.sizes?.large?.source_url || image.url;
	return imageProps;
};

const TiledGalleryEdit = ( {
	attributes,
	clientId,
	isSelected,
	noticeOperations,
	noticeUI,
	setAttributes,
} ) => {
	const {
		align,
		columns = defaultColumnsNumber( attributes ),
		imageFilter,
		images,
		linkTo,
		roundedCorners,
		columnWidths,
	} = attributes;
	const layoutStyle = getActiveStyleName( LAYOUT_STYLES, attributes.className );

	const blockProps = useBlockProps();
	const { getBlockAttributes } = useSelect( blockEditorStore );
	const mediaUpload = useSelect(
		select => select( blockEditorStore ).getSettings().mediaUpload,
		[]
	);
	const [ selectedImage, setSelectedImage ] = useState( null );
	const [ changed, setChanged ] = useState(
		'undefined' === typeof columnWidths || columnWidths?.length === 0 ? true : false
	);

	const setImages = ( imgs, otherAttributes ) => {
		setAttributes( {
			images: imgs,
			ids: imgs.map( ( { id } ) => parseInt( id, 10 ) ),
			...otherAttributes,
		} );
	};

	// One upload per file, each into a slot reserved up front: client-side media processing reports
	// each file separately rather than the whole batch, so each callback updates only its own image.
	// With `columnLimit`, clamp columns to the images left once each upload settles, as library selection does.
	const addFiles = ( files, columnLimit ) => {
		if ( ! mediaUpload ) {
			return;
		}
		// Pending placeholders don't count until an upload succeeds, so rejected files keep the setting.
		const updateImages = newImages =>
			setImages(
				newImages,
				columnLimit && newImages.some( ( { id } ) => id )
					? { columns: Math.min( newImages.length, columnLimit ) }
					: undefined
			);
		const uploads = Array.from( files ).map( file => ( {
			file,
			placeholderUrl: createBlobURL( file ),
		} ) );
		setImages( [
			...images,
			...uploads.map( ( { placeholderUrl } ) => ( { url: placeholderUrl } ) ),
		] );

		uploads.forEach( ( { file, placeholderUrl } ) => {
			let currentUrl = placeholderUrl;
			// Without media, the upload failed: drop its image.
			const updateUpload = media => {
				revokeBlobURL( placeholderUrl );
				const currentImages = getBlockAttributes( clientId )?.images || [];
				const index = currentImages.findIndex( ( { url } ) => url === currentUrl );
				// The user removed this image while it was still uploading.
				if ( index === -1 ) {
					return;
				}
				if ( ! media ) {
					updateImages( currentImages.filter( ( img, i ) => i !== index ) );
					return;
				}
				// Keep fields set while processing continues, such as a custom link.
				const image = { ...currentImages[ index ], ...pickRelevantMediaFiles( media ) };
				currentUrl = image.url;
				updateImages( currentImages.map( ( img, i ) => ( i === index ? image : img ) ) );
			};
			mediaUpload( {
				allowedTypes: ALLOWED_MEDIA_TYPES,
				filesList: [ file ],
				onFileChange: ( [ media ] ) => updateUpload( media ),
				onError: message => {
					updateUpload();
					noticeOperations.createErrorNotice( message );
				},
			} );
		} );

		setChanged( true );
	};

	const onRemoveImage = index => () => {
		const filteredImages = images.filter( ( img, i ) => index !== i );

		setSelectedImage( null );
		setChanged( true );

		setImages( filteredImages );
		setAttributes( { columns: columns ? Math.min( filteredImages.length, columns ) : columns } );
	};

	const onSelectImage = index => () => {
		if ( selectedImage !== index ) {
			setSelectedImage( index );
		}
	};

	const onSelectImages = files => {
		// Not `instanceof File`: files picked in the editor iframe come from that window's File.
		if ( Object.prototype.toString.call( files[ 0 ] ) === '[object File]' ) {
			addFiles( files, columns );
			return;
		}

		const newImages = files.map( file => {
			const existingImage = images.find(
				img => parseInt( img.id, 10 ) === parseInt( file.id, 10 )
			);

			if ( existingImage?.customLink ) {
				return {
					...pickRelevantMediaFiles( file ),
					customLink: existingImage.customLink,
				};
			}
			return pickRelevantMediaFiles( file );
		} );

		setImages( newImages );
		setAttributes( { columns: columns ? Math.min( files.length, columns ) : columns } );

		setChanged( true );
	};

	const onMove = ( oldIndex, newIndex ) => {
		const copy = [ ...images ];

		copy.splice( newIndex, 1, images[ oldIndex ] );
		copy.splice( oldIndex, 1, images[ newIndex ] );

		setSelectedImage( newIndex );
		setChanged( true );

		setImages( copy );
	};

	const onMoveForward = oldIndex => {
		return () => {
			if ( oldIndex === images.length - 1 ) {
				return;
			}
			onMove( oldIndex, oldIndex + 1 );
		};
	};

	const onMoveBackward = oldIndex => {
		return () => {
			if ( oldIndex === 0 ) {
				return;
			}
			onMove( oldIndex, oldIndex - 1 );
		};
	};

	const onResize = value => {
		// Recomputed widths are normally only persisted once the user has edited the
		// images, so that merely opening a post never marks it as modified. Widths
		// that no longer match the layout are the exception. The row and column shape
		// is recomputed from the images and the alignment on every render, so
		// changing either — changing the alignment in particular, which edits no
		// image — leaves the saved widths describing a layout the block no longer
		// draws. Saving those spreads one row's widths over a differently shaped row,
		// which is what published galleries render as rows only 57% of the content
		// width. See JETPACK-1990.
		if ( changed || ! hasSameColumnShape( value, columnWidths ) ) {
			setAttributes( { columnWidths: value } );
		}
	};

	const uploadFromFiles = event => addFiles( event.target.files );

	const setImageAttributes = index => attrs => {
		if ( ! images[ index ] ) {
			return;
		}

		setImages( [
			...images.slice( 0, index ),
			{ ...images[ index ], ...attrs },
			...images.slice( index + 1 ),
		] );
	};

	// Deselect images when deselecting the block
	useEffect( () => {
		if ( ! isSelected && null !== selectedImage ) {
			setSelectedImage( null );
		}
	}, [ isSelected, selectedImage, setSelectedImage ] );

	let content;

	if ( images.length === 0 ) {
		content = (
			<MediaPlaceholder
				icon={ getBlockIconComponent( metadata ) }
				labels={ {
					title: __( 'Tiled Gallery', 'jetpack' ),
					name: __( 'images', 'jetpack' ),
				} }
				onSelect={ onSelectImages }
				handleUpload={ false }
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
				<TiledGalleryInspectorControls
					layoutStyle={ layoutStyle }
					images={ images }
					columns={ columns }
					selectedImage={ selectedImage }
					setImageAttributes={ setImageAttributes }
					onColumnsChange={ value => setAttributes( { columns: value } ) }
					roundedCorners={ roundedCorners }
					onRoundedCornersChange={ value => setAttributes( { roundedCorners: value } ) }
					linkTo={ linkTo }
					onLinkToChange={ value => setAttributes( { linkTo: value } ) }
				/>

				{ noticeUI }

				<Layout
					className="tiled-gallery__wrapper"
					align={ align }
					columns={ columns }
					imageFilter={ imageFilter }
					images={ images }
					layoutStyle={ layoutStyle }
					linkTo={ linkTo }
					onMoveBackward={ onMoveBackward }
					onMoveForward={ onMoveForward }
					onRemoveImage={ onRemoveImage }
					onSelectImage={ onSelectImage }
					onResize={ onResize }
					roundedCorners={ roundedCorners }
					selectedImage={ isSelected ? selectedImage : null }
					setImageAttributes={ setImageAttributes }
				>
					<DropZone onFilesDrop={ addFiles } />
					{ isSelected && (
						<div className="tiled-gallery__add-item">
							<FormFileUpload
								multiple
								className="tiled-gallery__add-item-button"
								onChange={ uploadFromFiles }
								accept="image/*"
								icon="insert"
								__next40pxDefaultSize={ true }
							>
								{ __( 'Upload an image', 'jetpack' ) }
							</FormFileUpload>
						</div>
					) }
				</Layout>
			</>
		);
	}

	return (
		<div { ...blockProps }>
			<TiledGalleryBlockControls
				images={ images }
				onSelectImages={ onSelectImages }
				imageFilter={ imageFilter }
				onFilterChange={ value => {
					setAttributes( { imageFilter: value } );
					setSelectedImage( null );
				} }
			/>
			{ content }
		</div>
	);
};

export default withNotices( TiledGalleryEdit );
