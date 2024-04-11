import { getBlockIconComponent } from '@automattic/jetpack-shared-extension-utils';
import { MediaPlaceholder, useBlockProps } from '@wordpress/block-editor';
import { DropZone, FormFileUpload, withNotices } from '@wordpress/components';
import { mediaUpload } from '@wordpress/editor';
import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { filter, get, pick } from 'lodash';
import { getActiveStyleName } from '../../shared/block-styles';
import metadata from './block.json';
import { ALLOWED_MEDIA_TYPES, LAYOUT_STYLES } from './constants';
import { TiledGalleryBlockControls, TiledGalleryInspectorControls } from './controls';
import Layout from './layout';

const DEFAULT_COLUMNS_COUNT = 3;

export function defaultColumnsNumber( attributes ) {
	return attributes.images.length > 0
		? Math.min( DEFAULT_COLUMNS_COUNT, attributes.images.length )
		: DEFAULT_COLUMNS_COUNT;
}

export const pickRelevantMediaFiles = image => {
	const imageProps = pick( image, [ [ 'alt' ], [ 'id' ], [ 'link' ] ] );
	imageProps.url =
		get( image, [ 'sizes', 'large', 'url' ] ) ||
		get( image, [ 'media_details', 'sizes', 'large', 'source_url' ] ) ||
		image.url;
	return imageProps;
};

const TiledGalleryEdit = ( {
	attributes,
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
	const [ selectedImage, setSelectedImage ] = useState( null );
	const [ changed, setChanged ] = useState(
		'undefined' === typeof columnWidths || columnWidths?.length === 0 ? true : false
	);

	const setImages = imgs => {
		setAttributes( {
			images: imgs,
			ids: imgs.map( ( { id } ) => parseInt( id, 10 ) ),
		} );
	};

	const addFiles = files => {
		mediaUpload( {
			allowedTypes: ALLOWED_MEDIA_TYPES,
			filesList: files,
			onFileChange: value =>
				setImages( ( images || [] ).concat( value.map( pickRelevantMediaFiles ) ) ),
			onError: noticeOperations.createErrorNotice,
		} );

		setChanged( true );
	};

	const onRemoveImage = index => () => {
		const filteredImages = filter( images, ( img, i ) => index !== i );

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
		setImages( files.map( pickRelevantMediaFiles ) );
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
		if ( changed ) {
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
