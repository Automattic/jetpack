/**
 * External dependencies
 */
import classNames from 'classnames';
import { get, pick } from 'lodash';

/**
 * WordPress dependencies
 */
import { createElement, Fragment, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { isBlobURL } from '@wordpress/blob';
import { useDispatch } from '@wordpress/data';
import { BlockIcon, MediaPlaceholder } from '@wordpress/block-editor';
import { mediaUpload } from '@wordpress/editor';
import { DropZone, FormFileUpload, withNotices } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { icon } from '.';
import Controls from './controls';
import StoryPlayer from './player';
import './editor.scss';

const ALLOWED_MEDIA_TYPES = [ 'image', 'video' ];

export const pickRelevantMediaFiles = ( media, sizeSlug = 'large' ) => {
	const mediaProps = pick( media, [ 'alt', 'id', 'link', 'type', 'mime', 'caption' ] );
	mediaProps.url =
		get( media, [ 'sizes', sizeSlug, 'url' ] ) ||
		get( media, [ 'media_details', 'sizes', sizeSlug, 'source_url' ] ) ||
		get( media, [ 'media_details', 'videopress', 'original' ] ) ||
		get( media, [ 'media_details', 'original', 'url' ] ) ||
		media.url;
	mediaProps.type = media.media_type || media.type;
	mediaProps.mime = media.mime_type || media.mime;
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

	const mediaReadyFilter = files =>
		files.map( pickRelevantMediaFiles ).filter( media => ! isBlobURL( media.url ) );
	const onSelectMedia = newMediaFiles =>
		setAttributes( { mediaFiles: mediaReadyFilter( newMediaFiles ) } );

	const addFiles = files => {
		const lockName = 'storyBlockLock';
		lockPostSaving( lockName );
		mediaUpload( {
			allowedTypes: ALLOWED_MEDIA_TYPES,
			filesList: files,
			onFileChange: newMediaFiles => {
				const mediaUploaded = mediaReadyFilter( newMediaFiles );
				setAttributes( {
					mediaFiles: [ ...mediaFiles, ...mediaUploaded ],
				} );
				if ( newMediaFiles.length === mediaUploaded.length ) {
					unlockPostSaving( lockName );
				}
			},
			onError: noticeOperations.createErrorNotice,
		} );
	};

	const controls = (
		<Controls
			allowedMediaTypes={ ALLOWED_MEDIA_TYPES }
			attributes={ attributes }
			onSelectMedia={ onSelectMedia }
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
					onSelect={ onSelectMedia }
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
			<div className={ classNames( 'wp-block-jetpack-story', 'wp-story', className ) }>
				<StoryPlayer
					slides={ mediaFiles }
					disabled={ ! isSelected }
					settings={ {
						shadowDOM: {
							enabled: false,
						},
						playInFullscreen: false,
						tapToPlayPause: true,
					} }
				/>
			</div>
			<DropZone onFilesDrop={ addFiles } />
			{ isSelected && (
				<div className="wp-block-jetpack-story__add-item">
					<FormFileUpload
						multiple
						isLarge
						className="wp-block-jetpack-story__add-item-button"
						onChange={ event => addFiles( event.target.files ) }
						accept={ ALLOWED_MEDIA_TYPES.map( type => type + '/*' ).join( ',' ) }
						icon="insert"
					>
						{ __( 'Add slide', 'jetpack' ) }
					</FormFileUpload>
				</div>
			) }
		</Fragment>
	);
} );
