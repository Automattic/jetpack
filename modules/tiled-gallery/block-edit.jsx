/*global wp*/

/**
 * External Dependencies
 */
import React from 'react';
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
	Toolbar,
	PanelBody,
	RangeControl,
	SelectControl,
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
import JetpackGalleryBlockSave from './block-save.jsx';

const MAX_COLUMNS = 8;
const linkOptions = [
	{ value: 'attachment', label: __( 'Attachment Page' ) },
	{ value: 'media', label: __( 'Media File' ) },
	{ value: 'none', label: __( 'None' ) },
];

class JetpackGalleryBlockEditor extends Component {
	constructor() {
		super( ...arguments );

		this.onSelectImage = this.onSelectImage.bind( this );
		this.onSelectImages = this.onSelectImages.bind( this );
		this.setLinkTo = this.setLinkTo.bind( this );
		this.setColumnsNumber = this.setColumnsNumber.bind( this );
		this.setImageAttributes = this.setImageAttributes.bind( this );
		this.addFiles = this.addFiles.bind( this );

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

	onSelectImages( images ) {
		this.props.setAttributes( {
			images: images.map( ( image ) => pick( image, [ 'alt', 'caption', 'id', 'url', 'link' ] ) ),
		} );
	}

	setLinkTo( value ) {
		this.props.setAttributes( { linkTo: value } );
	}

	setColumnsNumber( value ) {
		this.props.setAttributes( { columns: value } );
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
		const { images, columns, linkTo } = attributes;

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

		// To avoid users accidentally navigating out of Gutenberg by clicking an image, we disable linkTo in the editor view here by forcing 'none'.
		const imageTiles = (
			<JetpackGalleryBlockSave
				attributes={ {
					images: images,
					columns: columns,
					linkTo: 'none',
				} }
			/>
		);

		return [
			controls,
			isSelected && (
				<InspectorControls key="inspector">
					<PanelBody title={ __( 'Jetpack Gallery Settings' ) }>
						{ images.length > 1 && <RangeControl
							label={ __( 'Columns' ) }
							value={ columns }
							onChange={ this.setColumnsNumber }
							min={ 1 }
							max={ Math.min( MAX_COLUMNS, images.length ) }
						/> }
						<SelectControl
							label={ __( 'Link to' ) }
							value={ linkTo }
							onChange={ this.setLinkTo }
							options={ linkOptions }
						/>
					</PanelBody>
				</InspectorControls>
			),
			imageTiles,
			dropZone,
		];
	}
}

export default JetpackGalleryBlockEditor;
