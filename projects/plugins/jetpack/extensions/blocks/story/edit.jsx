import { getBlockIconComponent } from '@automattic/jetpack-shared-extension-utils';
import {
	MediaPlaceholder,
	store as blockEditorStore,
	useBlockProps,
} from '@wordpress/block-editor';
import { withNotices } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
import uploadFilesIndividually, {
	isFileSelection,
	usePlaceholderSaveLock,
} from '../../shared/upload-files-individually';
import metadata from './block.json';
import Controls from './controls';
import StoryPlayer from './player';

import './editor.scss';

const ALLOWED_MEDIA_TYPES = [ 'image', 'video' ];
const ALLOWED_MEDIA_PROPS = [
	'alt',
	'title',
	'id',
	'link',
	'type',
	'mime',
	'caption',
	'width',
	'height',
];
const icon = getBlockIconComponent( metadata );

export const pickRelevantMediaFiles = media => {
	const mediaProps = Object.fromEntries(
		Object.entries( media ).filter( ( [ k ] ) => ALLOWED_MEDIA_PROPS.includes( k ) )
	);
	mediaProps.url =
		media?.media_details?.original?.url ||
		media?.media_details?.videopress?.original ||
		media?.media_details?.sizes?.large?.source_url ||
		media?.sizes?.large?.url ||
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
	clientId,
	isSelected,
	noticeOperations,
	noticeUI,
	setAttributes,
} ) {
	const { mediaFiles } = attributes;
	const { getBlockAttributes } = useSelect( blockEditorStore );
	const mediaUpload = useSelect(
		select => select( blockEditorStore ).getSettings().mediaUpload,
		[]
	);
	const blockProps = useBlockProps();
	usePlaceholderSaveLock( mediaFiles, `storyBlockLock-${ clientId }` );

	const setMediaFiles = allMedia => setAttributes( { mediaFiles: allMedia } );

	const onSelectMedia = newMediaFiles => {
		if ( isFileSelection( newMediaFiles ) ) {
			uploadFilesIndividually( {
				files: newMediaFiles,
				mediaUpload,
				allowedTypes: ALLOWED_MEDIA_TYPES,
				getItems: () => getBlockAttributes( clientId )?.mediaFiles || [],
				setItems: setMediaFiles,
				// Core's upload previews carry only a URL: keep the file's type so a video renders as one.
				toPlaceholder: ( file, url ) => ( {
					url,
					type: file.type.split( '/' )[ 0 ],
					mime: file.type,
				} ),
				toItem: ( media, { type, mime } ) => {
					const item = pickRelevantMediaFiles( media );
					return { ...item, type: item.type || type, mime: item.mime || mime };
				},
				onError: noticeOperations.createErrorNotice,
			} );
			return;
		}
		setMediaFiles(
			newMediaFiles
				.map( newMedia => {
					// MediaPlaceholder passes only the media ids as value to MediaUpload, so we're only getting those back
					if ( ! isNaN( newMedia ) ) {
						const existingMedia = mediaFiles.find( mediaFile => mediaFile.id === newMedia );
						return existingMedia || { id: newMedia };
					}
					return newMedia;
				} )
				.map( pickRelevantMediaFiles )
		);
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
			className={ blockProps.className }
			disableMediaButtons={ hasImages && ! isSelected }
			icon={ ! hasImages && icon }
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
			handleUpload={ false }
			accept={ ALLOWED_MEDIA_TYPES.map( type => type + '/*' ).join( ',' ) }
			allowedTypes={ ALLOWED_MEDIA_TYPES }
			multiple="add"
			value={ mediaFiles }
			notices={ hasImages ? undefined : noticeUI }
			onError={ noticeOperations.createErrorNotice }
		/>
	);

	let content;

	if ( ! hasImages ) {
		content = (
			<>
				{ controls }
				{ mediaPlaceholder }
			</>
		);
	} else {
		content = (
			<>
				{ controls }
				{ noticeUI }
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
				{ isSelected && mediaPlaceholder }
			</>
		);
	}

	return (
		<div
			{ ...blockProps }
			className={ clsx( 'wp-block-jetpack-story', 'wp-story', blockProps.className ) }
		>
			{ content }
		</div>
	);
} );
