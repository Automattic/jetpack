import {
	BlockControls,
	InspectorControls,
	MediaPlaceholder,
	MediaUpload,
} from '@wordpress/block-editor';
import {
	DropZone,
	FormFileUpload,
	PanelBody,
	RangeControl,
	SelectControl,
	ToolbarGroup,
	ToolbarItem,
	withNotices,
} from '@wordpress/components';
import { mediaUpload } from '@wordpress/editor';
import { Component, Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { filter, get, pick } from 'lodash';
import { getActiveStyleName } from '../../shared/block-styles';
import EditButton from '../../shared/edit-button';
import {
	ALLOWED_MEDIA_TYPES,
	LAYOUT_CIRCLE,
	LAYOUT_STYLES,
	MAX_COLUMNS,
	MAX_ROUNDED_CORNERS,
} from './constants';
import FilterToolbar from './filter-toolbar';
import Layout from './layout';
import { icon } from '.';

const linkOptions = [
	{ value: 'attachment', label: __( 'Attachment Page', 'jetpack' ) },
	{ value: 'media', label: __( 'Media File', 'jetpack' ) },
	{ value: 'none', label: __( 'None', 'jetpack' ) },
];

// @TODO keep here or move to ./layout ?
function layoutSupportsColumns( layout ) {
	return [ 'columns', 'circle', 'square' ].includes( layout );
}

export function defaultColumnsNumber( attributes ) {
	return Math.min( 3, attributes.images.length );
}

export const pickRelevantMediaFiles = image => {
	const imageProps = pick( image, [ [ 'alt' ], [ 'id' ], [ 'link' ] ] );
	imageProps.url =
		get( image, [ 'sizes', 'large', 'url' ] ) ||
		get( image, [ 'media_details', 'sizes', 'large', 'source_url' ] ) ||
		image.url;
	return imageProps;
};

class TiledGalleryEdit extends Component {
	state = {
		selectedImage: null,
		changed:
			'undefined' === typeof this.props.attributes.columnWidths ||
			this.props.attributes.columnWidths?.length === 0
				? true
				: false,
	};

	static getDerivedStateFromProps( props, state ) {
		// Deselect images when deselecting the block
		if ( ! props.isSelected && null !== state.selectedImage ) {
			return { selectedImage: null };
		}
		return null;
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

	addFiles = files => {
		const currentImages = this.props.attributes.images || [];
		const { noticeOperations } = this.props;
		mediaUpload( {
			allowedTypes: ALLOWED_MEDIA_TYPES,
			filesList: files,
			onFileChange: images => {
				const imagesNormalized = images.map( image => pickRelevantMediaFiles( image ) );
				this.setAttributes( { images: currentImages.concat( imagesNormalized ) } );
			},
			onError: noticeOperations.createErrorNotice,
		} );
		this.setState( { changed: true } );
	};

	onRemoveImage = index => () => {
		const images = filter( this.props.attributes.images, ( img, i ) => index !== i );
		const { columns } = this.props.attributes;
		this.setState( {
			selectedImage: null,
			changed: true,
		} );
		this.setAttributes( {
			images,
			columns: columns ? Math.min( images.length, columns ) : columns,
		} );
	};

	onSelectImage = index => () => {
		if ( this.state.selectedImage !== index ) {
			this.setState( {
				selectedImage: index,
			} );
		}
	};

	onSelectImages = images => {
		const { columns } = this.props.attributes;
		this.setAttributes( {
			columns: columns ? Math.min( images.length, columns ) : columns,
			images: images.map( image => pickRelevantMediaFiles( image ) ),
		} );
		this.setState( { changed: true } );
	};

	onMove = ( oldIndex, newIndex ) => {
		const images = [ ...this.props.attributes.images ];
		images.splice( newIndex, 1, this.props.attributes.images[ oldIndex ] );
		images.splice( oldIndex, 1, this.props.attributes.images[ newIndex ] );
		this.setState( {
			selectedImage: newIndex,
			changed: true,
		} );
		this.setAttributes( { images } );
	};

	onMoveForward = oldIndex => {
		return () => {
			if ( oldIndex === this.props.attributes.images.length - 1 ) {
				return;
			}
			this.onMove( oldIndex, oldIndex + 1 );
		};
	};

	onMoveBackward = oldIndex => {
		return () => {
			if ( oldIndex === 0 ) {
				return;
			}
			this.onMove( oldIndex, oldIndex - 1 );
		};
	};

	onResize = columnWidths => {
		if ( this.state.changed ) {
			this.setAttributes( { columnWidths } );
		}
	};

	setColumnsNumber = value => this.setAttributes( { columns: value } );

	setRoundedCorners = value => this.setAttributes( { roundedCorners: value } );

	setImageAttributes = index => attributes => {
		const {
			attributes: { images },
		} = this.props;
		if ( ! images[ index ] ) {
			return;
		}
		this.setAttributes( {
			images: [
				...images.slice( 0, index ),
				{ ...images[ index ], ...attributes },
				...images.slice( index + 1 ),
			],
		} );
	};

	setLinkTo = value => this.setAttributes( { linkTo: value } );

	uploadFromFiles = event => this.addFiles( event.target.files );

	render() {
		const { selectedImage } = this.state;
		const {
			attributes,
			isSelected,
			className,
			noticeOperations,
			noticeUI,
			setAttributes,
		} = this.props;
		const {
			align,
			columns = defaultColumnsNumber( attributes ),
			imageFilter,
			images,
			linkTo,
			roundedCorners,
		} = attributes;

		const dropZone = <DropZone onFilesDrop={ this.addFiles } />;

		const controls = (
			<BlockControls>
				{ !! images.length && (
					<Fragment>
						<ToolbarGroup>
							<ToolbarItem>
								{ () => (
									<MediaUpload
										onSelect={ this.onSelectImages }
										allowedTypes={ ALLOWED_MEDIA_TYPES }
										multiple
										gallery
										value={ images.map( img => img.id ) }
										render={ ( { open } ) => (
											<EditButton label={ __( 'Edit Gallery', 'jetpack' ) } onClick={ open } />
										) }
									/>
								) }
							</ToolbarItem>
						</ToolbarGroup>
						<FilterToolbar
							value={ imageFilter }
							onChange={ value => {
								setAttributes( { imageFilter: value } );
								this.setState( { selectedImage: null } );
							} }
						/>
					</Fragment>
				) }
			</BlockControls>
		);

		if ( images.length === 0 ) {
			return (
				<Fragment>
					{ controls }
					<MediaPlaceholder
						icon={ icon }
						className={ className }
						labels={ {
							title: __( 'Tiled Gallery', 'jetpack' ),
							name: __( 'images', 'jetpack' ),
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

		const layoutStyle = getActiveStyleName( LAYOUT_STYLES, attributes.className );

		return (
			<Fragment>
				{ controls }
				<InspectorControls>
					<PanelBody title={ __( 'Tiled Gallery settings', 'jetpack' ) }>
						{ layoutSupportsColumns( layoutStyle ) && images.length > 1 && (
							<RangeControl
								label={ __( 'Columns', 'jetpack' ) }
								value={ columns }
								onChange={ this.setColumnsNumber }
								min={ 1 }
								max={ Math.min( MAX_COLUMNS, images.length ) }
							/>
						) }
						{ layoutStyle !== LAYOUT_CIRCLE && (
							<RangeControl
								label={ __( 'Rounded corners', 'jetpack' ) }
								value={ roundedCorners }
								onChange={ this.setRoundedCorners }
								min={ 0 }
								max={ MAX_ROUNDED_CORNERS }
							/>
						) }
						<SelectControl
							label={ __( 'Link To', 'jetpack' ) }
							value={ linkTo }
							onChange={ this.setLinkTo }
							options={ linkOptions }
						/>
					</PanelBody>
				</InspectorControls>

				{ noticeUI }

				<Layout
					align={ align }
					className={ className }
					columns={ columns }
					imageFilter={ imageFilter }
					images={ images }
					layoutStyle={ layoutStyle }
					linkTo={ linkTo }
					onMoveBackward={ this.onMoveBackward }
					onMoveForward={ this.onMoveForward }
					onRemoveImage={ this.onRemoveImage }
					onSelectImage={ this.onSelectImage }
					onResize={ this.onResize }
					roundedCorners={ roundedCorners }
					selectedImage={ isSelected ? selectedImage : null }
					setImageAttributes={ this.setImageAttributes }
				>
					{ dropZone }
					{ isSelected && (
						<div className="tiled-gallery__add-item">
							<FormFileUpload
								multiple
								className="tiled-gallery__add-item-button"
								onChange={ this.uploadFromFiles }
								accept="image/*"
								icon="insert"
							>
								{ __( 'Upload an image', 'jetpack' ) }
							</FormFileUpload>
						</div>
					) }
				</Layout>
			</Fragment>
		);
	}
}

export default withNotices( TiledGalleryEdit );
