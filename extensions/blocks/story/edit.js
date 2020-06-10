/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { Component, Fragment } from '@wordpress/element';
import { compose } from '@wordpress/compose';
import { filter, get, map, pick } from 'lodash';
import { isBlobURL } from '@wordpress/blob';
import { withDispatch, withSelect } from '@wordpress/data';
import { BlockIcon, MediaPlaceholder } from '@wordpress/block-editor';
import { mediaUpload } from '@wordpress/editor';
import { DropZone, FormFileUpload, withNotices } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { icon } from '.';
import Controls from './controls';
import Story from './story';
import './editor.scss';

const ALLOWED_MEDIA_TYPES = [ 'image', 'video' ];

export const pickRelevantMediaFiles = ( media, sizeSlug ) => {
	const mediaProps = pick( media, [ 'alt', 'id', 'link', 'type', 'mime', 'caption' ] );
	mediaProps.url =
		get( media, [ 'sizes', sizeSlug, 'url' ] ) ||
		get( media, [ 'media_details', 'sizes', sizeSlug, 'source_url' ] ) ||
		media.url;
	return mediaProps;
};

class StoryEdit extends Component {
	constructor() {
		super( ...arguments );
		this.state = {
			selectedMedia: null,
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
				'The "ids" attribute should not be changed directly. It is managed automatically when "mediaFiles" attribute changes'
			);
		}

		if ( attributes.mediaFiles ) {
			attributes = {
				...attributes,
				ids: attributes.mediaFiles.map( ( { id } ) => parseInt( id, 10 ) ),
			};
		}

		this.props.setAttributes( attributes );
	}
	onSelectMedia = mediaFiles => {
		const { sizeSlug } = this.props.attributes;
		const mapped = mediaFiles.map( image => pickRelevantMediaFiles( image, sizeSlug ) );
		this.setAttributes( {
			mediaFiles: mapped,
		} );
	};
	onRemoveImage = index => {
		return () => {
			const mediaFiles = filter( this.props.attributes.mediaFiles, ( img, i ) => index !== i );
			this.setState( { selectedMedia: null } );
			this.setAttributes( { mediaFiles } );
		};
	};
	addFiles = files => {
		const currentMediaFiles = this.props.attributes.mediaFiles || [];
		const sizeSlug = this.props.attributes.sizeSlug;
		const { lockPostSaving, unlockPostSaving, noticeOperations } = this.props;
		const lockName = 'storyBlockLock';
		lockPostSaving( lockName );
		mediaUpload( {
			allowedTypes: ALLOWED_MEDIA_TYPES,
			filesList: files,
			onFileChange: mediaFiles => {
				const mediaFilesNormalized = mediaFiles.map( image =>
					pickRelevantMediaFiles( image, sizeSlug )
				);
				this.setAttributes( {
					mediaFiles: [ ...currentMediaFiles, ...mediaFilesNormalized ],
				} );
				if ( ! mediaFilesNormalized.every( image => isBlobURL( image.url ) ) ) {
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
	updateMediaFilesSize = sizeSlug => {
		const { mediaFiles } = this.props.attributes;
		const { resizedMediaFiles } = this.props;

		const updatedMediaFiles = mediaFiles.map( image => {
			const resizedImage = resizedMediaFiles.find(
				( { id } ) => parseInt( id, 10 ) === parseInt( image.id, 10 )
			);
			const url = get( resizedImage, [ 'sizes', sizeSlug, 'source_url' ] );
			return {
				...image,
				...( url && { url } ),
			};
		} );

		this.setAttributes( { mediaFiles: updatedMediaFiles, sizeSlug } );
	};
	render() {
		const { attributes, className, isSelected, noticeOperations, noticeUI } = this.props;
		const { align, mediaFiles } = attributes;

		const imageSizeOptions = this.getImageSizeOptions();
		const controls = (
			<Controls
				allowedMediaTypes={ ALLOWED_MEDIA_TYPES }
				attributes={ attributes }
				imageSizeOptions={ imageSizeOptions }
				onChangeImageSize={ this.updateMediaFilesSize }
				onSelectMedia={ this.onSelectMedia }
				setAttributes={ attrs => this.setAttributes( attrs ) }
			/>
		);

		if ( mediaFiles.length === 0 ) {
			return (
				<Fragment>
					{ controls }
					<MediaPlaceholder
						icon={ <BlockIcon icon={ icon } /> }
						className={ className }
						labels={ {
							title: __( 'Story', 'jetpack' ),
							instructions: __(
								'Drag images and videos, upload new ones or select files from your library.',
								'jetpack'
							),
						} }
						onSelect={ this.onSelectMedia }
						accept={ ALLOWED_MEDIA_TYPES.map( type => type + '/*' ).join( ',' ) }
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
				<Story
					align={ align }
					className={ className }
					mediaFiles={ mediaFiles }
					onError={ noticeOperations.createErrorNotice }
				/>
				<DropZone onFilesDrop={ this.addFiles } />
				{ isSelected && (
					<div className="wp-block-jetpack-story__add-item">
						<FormFileUpload
							multiple
							isLarge
							className="wp-block-jetpack-story__add-item-button"
							onChange={ this.uploadFromFiles }
							accept={ ALLOWED_MEDIA_TYPES.map( type => type + '/*' ).join( ',' ) }
							icon="insert"
						>
							{ __( 'Upload a media', 'jetpack' ) }
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
		const resizedMediaFiles = props.attributes.ids.reduce( ( currentResizedMediaFiles, id ) => {
			const image = select( 'core' ).getMedia( id );
			const sizes = get( image, [ 'media_details', 'sizes' ] );
			return [ ...currentResizedMediaFiles, { id, sizes } ];
		}, [] );
		return {
			imageSizes,
			resizedMediaFiles,
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
)( StoryEdit );
