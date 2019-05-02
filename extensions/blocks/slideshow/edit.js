/**
 * External dependencies
 */
import { __, _x } from '@wordpress/i18n';
import { Component, Fragment } from '@wordpress/element';
import { compose } from '@wordpress/compose';
import { filter, pick } from 'lodash';
import { isBlobURL } from '@wordpress/blob';
import { withDispatch } from '@wordpress/data';
import {
	BlockControls,
	BlockIcon,
	InspectorControls,
	MediaPlaceholder,
	MediaUpload,
	mediaUpload,
} from '@wordpress/editor';
import {
	DropZone,
	FormFileUpload,
	IconButton,
	PanelBody,
	RangeControl,
	SelectControl,
	ToggleControl,
	Toolbar,
	withNotices,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import { icon } from '.';
import Slideshow from './slideshow';
import './editor.scss';

const ALLOWED_MEDIA_TYPES = [ 'image' ];

const effectOptions = [
	{ label: _x( 'Slide', 'Slideshow transition effect', 'jetpack' ), value: 'slide' },
	{ label: _x( 'Fade', 'Slideshow transition effect', 'jetpack' ), value: 'fade' },
];

export const pickRelevantMediaFiles = image =>
	pick( image, [ 'alt', 'id', 'link', 'url', 'caption' ] );

class SlideshowEdit extends Component {
	constructor() {
		super( ...arguments );
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
				ids: attributes.images.map( ( { id } ) => parseInt( id, 10 ) ),
			};
		}

		this.props.setAttributes( attributes );
	}
	onSelectImages = images => {
		const mapped = images.map( image => pickRelevantMediaFiles( image ) );
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
		const { lockPostSaving, unlockPostSaving, noticeOperations } = this.props;
		const lockName = 'slideshowBlockLock';
		lockPostSaving( lockName );
		mediaUpload( {
			allowedTypes: ALLOWED_MEDIA_TYPES,
			filesList: files,
			onFileChange: images => {
				const imagesNormalized = images.map( image => pickRelevantMediaFiles( image ) );
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
	render() {
		const {
			attributes,
			className,
			isSelected,
			noticeOperations,
			noticeUI,
			setAttributes,
		} = this.props;
		const { align, autoplay, delay, effect, images } = attributes;
		const prefersReducedMotion =
			typeof window !== 'undefined' &&
			window.matchMedia( '(prefers-reduced-motion: reduce)' ).matches;
		const controls = (
			<Fragment>
				<InspectorControls>
					<PanelBody title={ __( 'Autoplay', 'jetpack' ) }>
						<ToggleControl
							label={ __( 'Autoplay', 'jetpack' ) }
							help={ __( 'Autoplay between slides', 'jetpack' ) }
							checked={ autoplay }
							onChange={ value => {
								setAttributes( { autoplay: value } );
							} }
						/>
						{ autoplay && (
							<RangeControl
								label={ __( 'Delay between transitions (in seconds)', 'jetpack' ) }
								value={ delay }
								onChange={ value => {
									setAttributes( { delay: value } );
								} }
								min={ 1 }
								max={ 5 }
							/>
						) }
						{ autoplay && prefersReducedMotion && (
							<span>
								{ __(
									'The Reduce Motion accessibility option is selected, therefore autoplay will be disabled in this browser.',
									'jetpack'
								) }
							</span>
						) }
					</PanelBody>
					<PanelBody title={ __( 'Effects', 'jetpack' ) }>
						<SelectControl
							label={ __( 'Transition effect', 'jetpack' ) }
							value={ effect }
							onChange={ value => {
								setAttributes( { effect: value } );
							} }
							options={ effectOptions }
						/>
					</PanelBody>
				</InspectorControls>
				<BlockControls>
					{ !! images.length && (
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
										label={ __( 'Edit Slideshow', 'jetpack' ) }
										icon="edit"
										onClick={ open }
									/>
								) }
							/>
						</Toolbar>
					) }
				</BlockControls>
			</Fragment>
		);

		if ( images.length === 0 ) {
			return (
				<Fragment>
					{ controls }
					<MediaPlaceholder
						icon={ <BlockIcon icon={ icon } /> }
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
							isLarge
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
	withDispatch( dispatch => {
		const { lockPostSaving, unlockPostSaving } = dispatch( 'core/editor' );
		return {
			lockPostSaving,
			unlockPostSaving,
		};
	} ),
	withNotices
)( SlideshowEdit );
