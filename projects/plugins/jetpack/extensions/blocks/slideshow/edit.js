import { isBlobURL } from '@wordpress/blob';
import { MediaPlaceholder, BlockControls, InspectorControls } from '@wordpress/block-editor';
import { DropZone, FormFileUpload, withNotices } from '@wordpress/components';
import { compose } from '@wordpress/compose';
import { withDispatch, withSelect } from '@wordpress/data';
import { mediaUpload } from '@wordpress/editor';
import { Component, Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { filter, get, map, pick } from 'lodash';
import { PanelControls, ToolbarControls } from './controls';
import Slideshow from './slideshow';
import { icon } from '.';
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

export class SlideshowEdit extends Component {
	constructor() {
		super( ...arguments );
		this.state = {
			selectedImage: null,
		};
	}
	componentDidMount() {
		const { ids, sizeSlug } = this.props.attributes;
		if ( ! sizeSlug ) {
			// To improve the performance, we use large size images by default except for blocks inserted before the
			// image size attribute was added, since they were loading full size images. The presence or lack of images
			// in a block determines when it has been inserted (before or after we added the image size attribute),
			// given that now it is not possible to have a block with images and no size.
			this.setAttributes( { sizeSlug: ids.length ? 'full' : 'large' } );
		}
	}
	setAttributes( attributes ) {
		if ( attributes.ids ) {
			throw new Error(
				'The "ids" attribute should not be changed directly. It is managed automatically when "images" attribute changes'
			);
		}

		if ( attributes.images ) {
			attributes = {
				...attributes,
				ids: attributes.images.map( ( { id } ) => parseInt( id, 10 ) ),
			};
		}

		this.props.setAttributes( attributes );
	}
	onSelectImages = images => {
		const { sizeSlug } = this.props.attributes;
		const mapped = images.map( image => pickRelevantMediaFiles( image, sizeSlug ) );
		this.setAttributes( {
			images: mapped,
		} );
	};
	onRemoveImage = index => {
		return () => {
			const images = filter( this.props.attributes.images, ( img, i ) => index !== i );
			this.setState( { selectedImage: null } );
			this.setAttributes( { images } );
		};
	};
	addFiles = files => {
		const currentImages = this.props.attributes.images || [];
		const sizeSlug = this.props.attributes.sizeSlug;
		const { lockPostSaving, unlockPostSaving, noticeOperations } = this.props;
		const lockName = 'slideshowBlockLock';
		lockPostSaving( lockName );
		mediaUpload( {
			allowedTypes: ALLOWED_MEDIA_TYPES,
			filesList: files,
			onFileChange: images => {
				const imagesNormalized = images.map( image => pickRelevantMediaFiles( image, sizeSlug ) );
				this.setAttributes( {
					images: [ ...currentImages, ...imagesNormalized ],
				} );
				if ( ! imagesNormalized.every( image => isBlobURL( image.url ) ) ) {
					unlockPostSaving( lockName );
				}
			},
			onError: noticeOperations.createErrorNotice,
		} );
	};
	uploadFromFiles = event => this.addFiles( event.target.files );
	getImageSizeOptions() {
		const { imageSizes } = this.props;
		return map( imageSizes, ( { name, slug } ) => ( { value: slug, label: name } ) );
	}
	updateImagesSize = sizeSlug => {
		const { images } = this.props.attributes;
		const { resizedImages } = this.props;

		const updatedImages = images.map( image => {
			const resizedImage = resizedImages.find(
				( { id } ) => parseInt( id, 10 ) === parseInt( image.id, 10 )
			);
			const url = get( resizedImage, [ 'sizes', sizeSlug, 'source_url' ] );
			return {
				...image,
				...( url && { url } ),
			};
		} );

		this.setAttributes( { images: updatedImages, sizeSlug } );
	};
	render() {
		const { attributes, className, isSelected, noticeOperations, noticeUI } = this.props;
		const { align, autoplay, delay, effect, images } = attributes;

		const imageSizeOptions = this.getImageSizeOptions();
		const controls = (
			<>
				<InspectorControls>
					<PanelControls
						attributes={ attributes }
						imageSizeOptions={ imageSizeOptions }
						onChangeImageSize={ this.updateImagesSize }
						setAttributes={ attrs => this.setAttributes( attrs ) }
					/>
				</InspectorControls>
				<BlockControls>
					<ToolbarControls
						allowedMediaTypes={ ALLOWED_MEDIA_TYPES }
						attributes={ attributes }
						onSelectImages={ this.onSelectImages }
					/>
				</BlockControls>
			</>
		);

		if ( images.length === 0 ) {
			return (
				<Fragment>
					{ controls }
					<MediaPlaceholder
						icon={ icon }
						className={ className }
						labels={ {
							title: __( 'Slideshow', 'jetpack' ),
							instructions: __(
								'Drag images, upload new ones or select files from your library.',
								'jetpack'
							),
						} }
						onSelect={ this.onSelectImages }
						accept="image/*"
						allowedTypes={ ALLOWED_MEDIA_TYPES }
						multiple
						notices={ noticeUI }
						onError={ noticeOperations.createErrorNotice }
					/>
				</Fragment>
			);
		}
		return (
			<Fragment>
				{ controls }
				{ noticeUI }
				<Slideshow
					align={ align }
					autoplay={ autoplay }
					className={ className }
					delay={ delay }
					effect={ effect }
					images={ images }
					onError={ noticeOperations.createErrorNotice }
				/>
				<DropZone onFilesDrop={ this.addFiles } />
				{ isSelected && (
					<div className="wp-block-jetpack-slideshow__add-item">
						<FormFileUpload
							multiple
							className="wp-block-jetpack-slideshow__add-item-button"
							onChange={ this.uploadFromFiles }
							accept="image/*"
							icon="insert"
						>
							{ __( 'Upload an image', 'jetpack' ) }
						</FormFileUpload>
					</div>
				) }
			</Fragment>
		);
	}
}
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
