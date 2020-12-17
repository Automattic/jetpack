/**
 * External dependencies
 */
import classNames from 'classnames';
import { get, pick } from 'lodash';

/**
 * WordPress dependencies
 */
import { createElement, Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { isBlobURL } from '@wordpress/blob';
import { useDispatch } from '@wordpress/data';
import { BlockIcon, MediaPlaceholder } from '@wordpress/block-editor';
import { withNotices } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { icon } from '.';
import Controls from './controls';
import StoryPlayer from './player';
import './editor.scss';

const ALLOWED_MEDIA_TYPES = [ 'image', 'video' ];

export const pickRelevantMediaFiles = ( media, sizeSlug = 'large' ) => {
	const mediaProps = pick( media, [
		'alt',
		'title',
		'id',
		'link',
		'type',
		'mime',
		'caption',
		'width',
		'height',
	] );
	mediaProps.url =
		get( media, [ 'sizes', sizeSlug, 'url' ] ) ||
		get( media, [ 'media_details', 'sizes', sizeSlug, 'source_url' ] ) ||
		get( media, [ 'media_details', 'videopress', 'original' ] ) ||
		get( media, [ 'media_details', 'original', 'url' ] ) ||
		media.url;
	mediaProps.type = media.media_type || media.type;
	mediaProps.mime = media.mime_type || media.mime;
	mediaProps.title = mediaProps.title?.rendered || mediaProps.title;
	mediaProps.width = mediaProps.width || media.media_details?.width;
	mediaProps.height = mediaProps.height || media.media_details?.height;
	return mediaProps;
};

export default withNotices( function StoryEdit( {
	attributes,
	className,
	isSelected,
	noticeOperations,
	noticeUI,
	setAttributes,
} ) {
	const { mediaFiles } = attributes;
	const { lockPostSaving, unlockPostSaving } = useDispatch( 'core/editor' );
	const lockName = 'storyBlockLock';

	const onSelectMedia = newMediaFiles => {
		const allMedia = newMediaFiles.map( file => pickRelevantMediaFiles( file ) );
		const uploadedMedias = allMedia.filter( media => ! isBlobURL( media.url ) );
		// prevent saving blob urls in mediaFiles block attribute
		if ( allMedia.length !== uploadedMedias.length ) {
			lockPostSaving( lockName );
		} else {
			unlockPostSaving( lockName );
		}
		setAttributes( {
			mediaFiles: allMedia,
		} );
	};

	const controls = (
		<Controls
			allowedMediaTypes={ ALLOWED_MEDIA_TYPES }
			attributes={ attributes }
			onSelectMedia={ onSelectMedia }
		/>
	);

	const hasImages = !! mediaFiles.length;

	const mediaPlaceholder = (
		<MediaPlaceholder
			addToGallery={ hasImages }
			isAppender={ hasImages }
			className={ className }
			disableMediaButtons={ hasImages && ! isSelected }
			icon={ ! hasImages && <BlockIcon icon={ icon } /> }
			labels={ {
				title: ! hasImages && __( 'Story', 'jetpack' ),
				instructions:
					! hasImages &&
					__(
						'Drag images and videos, upload new ones, or select files from your library.',
						'jetpack'
					),
			} }
			onSelect={ onSelectMedia }
			accept={ ALLOWED_MEDIA_TYPES.map( type => type + '/*' ).join( ',' ) }
			allowedTypes={ ALLOWED_MEDIA_TYPES }
			multiple
			value={ mediaFiles }
			notices={ hasImages ? undefined : noticeUI }
			onError={ noticeOperations.createErrorNotice }
		/>
	);

	if ( ! hasImages ) {
		return (
			<Fragment>
				{ controls }
				{ mediaPlaceholder }
			</Fragment>
		);
	}

	return (
		<Fragment>
			{ controls }
			{ noticeUI }
			<div className={ classNames( 'wp-block-jetpack-story', 'wp-story', className ) }>
				<StoryPlayer
					slides={ mediaFiles }
					disabled={ ! isSelected }
					showSlideCount={ isSelected }
					shadowDOM={ {
						enabled: false,
					} }
					playInFullscreen={ false }
					tapToPlayPause={ false }
					playOnNextSlide={ false }
				/>
			</div>
			{ isSelected && mediaPlaceholder }
		</Fragment>
	);
} );
