/*global wp*/

/**
 * External Dependencies
 */
import React from 'react';
import filter from 'lodash/filter';
import pick from 'lodash/pick';

/**
 * WordPress dependencies (npm)
 */
const { Component } = wp.element;
const { __ } = wp.i18n;
const { mediaUpload } = wp.utils;

/**
 * WordPress dependencies (runtime – where should we get Gutenberg components from?)
 */
const {
	IconButton,
	DropZone,
	FormFileUpload,
	Toolbar,
} = wp.components;
const {
	MediaUpload,
	ImagePlaceholder,
	InspectorControls,
	BlockControls,
} = wp.blocks;

/**
 * Internal dependencies
 */
import TiledGalleryItem from './block/components/tiled-gallery-item.jsx';

class JetpackGalleryBlockEditor extends Component {
	constructor() {
		super( ...arguments );

		this.onSelectImage = this.onSelectImage.bind( this );
		this.onSelectImages = this.onSelectImages.bind( this );
		this.setLinkTo = this.setLinkTo.bind( this );
		this.setColumnsNumber = this.setColumnsNumber.bind( this );
		this.updateAlignment = this.updateAlignment.bind( this );
		this.toggleImageCrop = this.toggleImageCrop.bind( this );
		this.onRemoveImage = this.onRemoveImage.bind( this );
		this.setImageAttributes = this.setImageAttributes.bind( this );
		this.addFiles = this.addFiles.bind( this );
		this.uploadFromFiles = this.uploadFromFiles.bind( this );

		this.state = {
			selectedImage: null,
		};
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
			const { columns } = this.props.attributes;
			this.setState( { selectedImage: null } );
			this.props.setAttributes( {
				images,
				columns: columns ? Math.min( images.length, columns ) : columns,
			} );
		};
	}

	onSelectImages( images ) {
		this.props.setAttributes( {
			images: images.map( ( image ) => pick( image, [ 'alt', 'caption', 'id', 'url' ] ) ),
		} );
	}

	setLinkTo( value ) {
		this.props.setAttributes( { linkTo: value } );
	}

	setColumnsNumber( value ) {
		this.props.setAttributes( { columns: value } );
	}

	updateAlignment( nextAlign ) {
		this.props.setAttributes( { align: nextAlign } );
	}

	toggleImageCrop() {
		this.props.setAttributes( { imageCrop: ! this.props.attributes.imageCrop } );
	}

	setImageAttributes( index, attributes ) {
		const { attributes: { images }, setAttributes } = this.props;
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

	uploadFromFiles( event ) {
		this.addFiles( event.target.files );
	}

	addFiles( files ) {
		const currentImages = this.props.attributes.images || [];
		const { setAttributes } = this.props;
		mediaUpload(
			files,
			( images ) => {
				setAttributes( {
					images: currentImages.concat( images ),
				} );
			},
			'image',
		);
	}

	componentWillReceiveProps( nextProps ) {
		// Deselect images when deselecting the block
		if ( ! nextProps.isSelected && this.props.isSelected ) {
			this.setState( {
				selectedImage: null,
				captionSelected: false,
			} );
		}
	}

	render() {
		const { attributes, isSelected, className } = this.props;
		const { images } = attributes;

		const dropZone = (
			<DropZone key="item-dropzone"
				onFilesDrop={ this.addFiles }
			/>
		);

		const controls = (
			isSelected && (
				<BlockControls key="controls">
					{ !! images.length && (
						<Toolbar>
							<MediaUpload
								onSelect={ this.onSelectImages }
								type="image"
								multiple
								gallery
								value={ images.map( ( img ) => img.id ) }
								render={ function( { open } ) {
									return (
										<IconButton
											className="components-toolbar__control"
											label={ __( 'Edit Gallery' ) }
											icon="edit"
											onClick={ open }
										/>
									);
								}
							}
							/>
						</Toolbar>
					) }
				</BlockControls>
			)
		);

		if ( images.length === 0 ) {
			return [
				controls,
				<ImagePlaceholder key="gallery-placeholder"
					className={ className }
					icon="format-gallery"
					label={ __( 'Gallery' ) }
					onSelectImage={ this.onSelectImages }
					multiple
				/>,
			];
		}

		const imageTiles = images.map( ( props, index ) => {
			const setMyAttributes = ( attrs ) => this.setImageAttributes( index, attrs );
			return (
				<TiledGalleryItem
					key={ props.id }
					setAttributes={ setMyAttributes }
					{ ...props } />
				);
		} );

		return [
			controls,
			isSelected && (
				<InspectorControls key="inspector">
					<h2>{ __( 'Jetpack Gallery Settings' ) }</h2>
				</InspectorControls>
			),
			<ul key="gallery-images" className="jetpack-tiled-gallery">
				{ dropZone }
				{ imageTiles }
				{ isSelected &&
					<li key="item-uploader" className="blocks-gallery-item">
						<FormFileUpload
							multiple
							isLarge
							className="blocks-gallery-add-item-button"
							onChange={ this.uploadFromFiles }
							accept="image/*"
							icon="insert"
						>
							{ __( 'Upload an image' ) }
						</FormFileUpload>
					</li>
				}
			</ul>,
		];
	}
}

export default JetpackGalleryBlockEditor;
