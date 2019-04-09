/**
 * External dependencies
 */
import classNames from 'classnames';
import { filter, pick, map, get } from 'lodash';
import {
	IconButton,
	PanelBody,
	Toolbar,
	withNotices,
	DropZone,
	FormFileUpload,
} from '@wordpress/components';
import {
	BlockControls,
	BlockIcon,
	MediaPlaceholder,
	MediaUpload,
	mediaUpload,
	InspectorControls,
} from '@wordpress/editor';
import { compose } from '@wordpress/compose';
import { withDispatch } from '@wordpress/data';
import { isBlobURL } from '@wordpress/blob';
import { Component, Fragment } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Logo from './logo';
import icon from './icon';
import './editor.scss';

const ALLOWED_MEDIA_TYPES = [ 'image' ];

export const pickRelevantMediaFiles = image => {
	const imageProps = pick( image, [ 'alt', 'id', 'link' ] );
	imageProps.url =
		get( image, [ 'sizes', 'large', 'url' ] ) ||
		get( image, [ 'media_details', 'sizes', 'large', 'source_url' ] ) ||
		image.url;
	return imageProps;
};

class GalleryEdit extends Component {
	constructor() {
		super( ...arguments );

		this.onSelectImage = this.onSelectImage.bind( this );
		this.onSelectImages = this.onSelectImages.bind( this );
		this.onRemoveImage = this.onRemoveImage.bind( this );
		this.setImageAttributes = this.setImageAttributes.bind( this );
		this.setAttributes = this.setAttributes.bind( this );
		this.addFiles = this.addFiles.bind( this );
		this.uploadFromFiles = this.uploadFromFiles.bind( this );

		this.state = {
			selectedImage: null,
		};
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
				ids: map( attributes.images, 'id' ),
			};
		}

		this.props.setAttributes( attributes );
	}

	onSelectImage( index ) {
		return () => {
			if ( this.state.selectedImage !== index ) {
				this.setState( {
					selectedImage: index,
				} );
			}
		};
	}

	onRemoveImage( index ) {
		return () => {
			const images = filter( this.props.attributes.images, ( img, i ) => index !== i );
			this.setState( { selectedImage: null } );
			this.setAttributes( {
				images,
			} );
		};
	}

	onSelectImages( images ) {
		this.setAttributes( {
			images: images.map( image => pickRelevantMediaFiles( image ) ),
		} );
	}

	addFiles = files => {
		const currentImages = this.props.attributes.images || [];
		const { lockPostSaving, unlockPostSaving, noticeOperations, setAttributes } = this.props;
		const lockName = 'logoGalleryBlockLock';
		lockPostSaving( lockName );
		mediaUpload( {
			allowedTypes: ALLOWED_MEDIA_TYPES,
			filesList: files,
			onFileChange: images => {
				const imagesNormalized = images.map( image => pickRelevantMediaFiles( image ) );
				setAttributes( {
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

	setImageAttributes( index, attributes ) {
		const {
			attributes: { images },
		} = this.props;
		const { setAttributes } = this;
		if ( ! images[ index ] ) {
			return;
		}
		setAttributes( {
			images: [
				...images.slice( 0, index ),
				{
					...images[ index ],
					...attributes,
				},
				...images.slice( index + 1 ),
			],
		} );
	}

	componentDidUpdate( prevProps ) {
		// Deselect images when deselecting the block
		if ( ! this.props.isSelected && prevProps.isSelected ) {
			// https://reactjs.org/docs/react-component.html#componentdidupdate
			// eslint-disable-next-line react/no-did-update-set-state
			this.setState( {
				selectedImage: null,
			} );
		}
	}

	render() {
		const {
			attributes,
			isSelected,
			className,
			noticeOperations,
			noticeUI,
			setAttributes,
		} = this.props;
		const { logoSize, images } = attributes;
		const hasImages = !! images.length;

		const controls = (
			<BlockControls>
				{ hasImages && (
					<Toolbar>
						<MediaUpload
							onSelect={ this.onSelectImages }
							allowedTypes={ ALLOWED_MEDIA_TYPES }
							multiple
							gallery
							value={ images.map( img => img.id ) }
							render={ ( { open } ) => (
								<IconButton
									className="components-toolbar__control"
									label={ __( 'Edit gallery', 'jetpack' ) }
									icon="edit"
									onClick={ open }
								/>
							) }
						/>
					</Toolbar>
				) }
			</BlockControls>
		);

		const toolbarControls = [
			{
				icon: 'arrow-down',
				title: __( 'Small size', 'jetpack' ),
				isActive: logoSize === 'small',
				onClick: () => setAttributes( { logoSize: 'small' } ),
			},
			{
				icon: 'sort',
				title: __( 'Medium size', 'jetpack' ),
				isActive: logoSize === 'medium',
				onClick: () => setAttributes( { logoSize: 'medium' } ),
			},
			{
				icon: 'arrow-up',
				title: __( 'Large size', 'jetpack' ),
				isActive: logoSize === 'large',
				onClick: () => setAttributes( { logoSize: 'large' } ),
			},
		];

		if ( ! hasImages ) {
			return (
				<Fragment>
					{ controls }
					<MediaPlaceholder
						icon={ <BlockIcon icon={ icon } /> }
						className={ className }
						labels={ {
							title: __( 'Logo Gallery', 'jetpack' ),
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
				<InspectorControls>
					<PanelBody title={ __( 'Logo Gallery Settings', 'jetpack' ) }>
						<p>{ __( 'Logo size', 'jetpack' ) }</p>
						<Toolbar controls={ toolbarControls } />
					</PanelBody>
				</InspectorControls>
				{ noticeUI }
				<ul className={ classNames( className, `is-${ logoSize }` ) }>
					{ images.map( ( img, index ) => {
						/* translators: %1$d is the order number of the image, %2$d is the total number of images. */
						const ariaLabel = sprintf(
							__( 'image %1$d of %2$d in gallery', 'jetpack' ),
							index + 1,
							images.length
						);

						return (
							<li className="logo-gallery-item" key={ img.id || img.url }>
								<Logo
									url={ img.url }
									alt={ img.alt }
									id={ img.id }
									isSelected={ isSelected && this.state.selectedImage === index }
									onRemove={ this.onRemoveImage( index ) }
									onSelect={ this.onSelectImage( index ) }
									setAttributes={ attrs => this.setImageAttributes( index, attrs ) }
									aria-label={ ariaLabel }
								/>
							</li>
						);
					} ) }
				</ul>
				<DropZone onFilesDrop={ this.addFiles } />
				{ isSelected && (
					<div className="wp-block-jetpack-logo-gallery__add-item">
						<FormFileUpload
							multiple
							isLarge
							className="wp-block-jetpack-logo-gallery__add-item-button"
							onChange={ this.uploadFromFiles }
							accept="image/*"
							icon="insert"
						>
							{ __( 'Add a logo', 'jetpack' ) }
						</FormFileUpload>
					</div>
				) }
			</Fragment>
		);
	}
}

export default compose(
	withDispatch( dispatch => {
		const { lockPostSaving, unlockPostSaving } = dispatch( 'core/editor' );
		return {
			lockPostSaving,
			unlockPostSaving,
		};
	} ),
	withNotices
)( GalleryEdit );
