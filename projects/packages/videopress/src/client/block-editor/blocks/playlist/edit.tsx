/**
 * WordPress dependencies
 */
import {
	InspectorControls,
	MediaUpload,
	MediaUploadCheck,
	useBlockProps,
} from '@wordpress/block-editor';
import {
	Button,
	Notice,
	PanelBody,
	Placeholder,
	TextControl,
	ToggleControl,
} from '@wordpress/components';
import { useEffect, useRef, useState } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';
import { __, sprintf } from '@wordpress/i18n';
import { chevronDown, chevronUp, closeSmall } from '@wordpress/icons';
/**
 * Internal dependencies
 */
import { fetchVideoItem } from '../../../lib/fetch-video-item';
import { isVideoPressGuid, pickGUIDFromUrl } from '../../../lib/url';
import { VideoPressIcon } from '../video/components/icons';
import { VIDEOPRESS_VIDEO_ALLOWED_MEDIA_TYPES } from '../video/constants';
import './editor.scss';
/**
 * Types
 */
import type { PlaylistBlockAttributes, PlaylistVideo } from './types';
import type { AdminAjaxQueryAttachmentsResponseItemProps } from '../../../types';
import type { BlockEditProps } from '@wordpress/blocks';

/**
 * Extract a VideoPress GUID from user input, which can be
 * either a bare GUID or any recognized VideoPress URL.
 *
 * @param value - Raw user input.
 * @return The GUID, or null when the input is not recognized.
 */
function parseVideoInput( value: string ): string | null {
	const trimmed = value.trim();
	if ( ! trimmed ) {
		return null;
	}

	const guid = isVideoPressGuid( trimmed );
	if ( guid ) {
		return guid as string;
	}

	return pickGUIDFromUrl( trimmed );
}

/**
 * VideoPress Playlist block Edit component.
 *
 * @param props               - Block edit props.
 * @param props.attributes    - Block attributes.
 * @param props.setAttributes - Attributes setter.
 * @return React component.
 */
export default function PlaylistBlockEdit( {
	attributes,
	setAttributes,
}: BlockEditProps< PlaylistBlockAttributes > ) {
	const { videos, autoAdvance, loop } = attributes;
	const [ currentIndex, setCurrentIndex ] = useState( 0 );
	const [ newVideoInput, setNewVideoInput ] = useState( '' );
	const [ errorNotice, setErrorNotice ] = useState< string | null >( null );
	const [ isAddingVideo, setIsAddingVideo ] = useState( false );

	// Always points at the latest videos so async title fetches never clobber newer edits.
	const videosRef = useRef( videos );
	videosRef.current = videos;

	// GUIDs with a title refresh already started this editor session; they are
	// not re-fetched, so a failed lookup simply keeps the stored label.
	const titleFetchesStarted = useRef( new Set< string >() );

	// Titles always mirror the video data: every entry is refreshed once per
	// editor session, and the stored title is replaced whenever it differs.
	useEffect( () => {
		videos.forEach( video => {
			if ( titleFetchesStarted.current.has( video.guid ) ) {
				return;
			}

			titleFetchesStarted.current.add( video.guid );

			fetchVideoItem( { guid: video.guid, isPrivate: false, skipRatingControl: true } )
				.then( videoItem => {
					if ( ! videoItem?.title ) {
						return;
					}

					const title = decodeEntities( videoItem.title );
					const current = videosRef.current;

					if ( ! current.some( entry => entry.guid === video.guid && entry.title !== title ) ) {
						return;
					}

					setAttributes( {
						videos: current.map( entry =>
							entry.guid === video.guid ? { ...entry, title } : entry
						),
					} );
				} )
				.catch( () => {
					// Keep the stored title (or GUID) when the video data isn't reachable.
				} );
		} );
	}, [ videos, setAttributes ] );

	const blockProps = useBlockProps( { className: 'videopress-playlist-editor' } );

	const currentVideo = videos[ currentIndex ] ?? videos[ 0 ];

	const addVideo = async () => {
		if ( isAddingVideo ) {
			return;
		}

		const guid = parseVideoInput( newVideoInput );
		if ( ! guid ) {
			setErrorNotice(
				__( 'Enter a VideoPress GUID or a VideoPress video URL.', 'jetpack-videopress-pkg' )
			);
			return;
		}

		setIsAddingVideo( true );

		// The title always comes from the video data, for library and URL/GUID
		// additions alike; it's not editable in the playlist.
		let title;
		try {
			const videoItem = await fetchVideoItem( { guid, isPrivate: false, skipRatingControl: true } );
			if ( videoItem?.title ) {
				title = decodeEntities( videoItem.title );
				// Fresh from the video data; no need for the refresh effect to re-fetch it.
				titleFetchesStarted.current.add( guid );
			}
		} catch {
			// The entry still works without a title; the list shows the GUID and
			// the refresh effect below retries once more.
		}

		setAttributes( { videos: [ ...videosRef.current, { guid, ...( title && { title } ) } ] } );
		setNewVideoInput( '' );
		setErrorNotice( null );
		setIsAddingVideo( false );
	};

	const addVideosFromLibrary = (
		selection:
			| AdminAjaxQueryAttachmentsResponseItemProps
			| AdminAjaxQueryAttachmentsResponseItemProps[]
	) => {
		const mediaItems = Array.isArray( selection ) ? selection : [ selection ];

		const libraryVideos: PlaylistVideo[] = [];
		for ( const media of mediaItems ) {
			// Depending on the endpoint, `videopress_guid` can be an array or a string.
			const guid = Array.isArray( media?.videopress_guid )
				? media.videopress_guid[ 0 ]
				: media?.videopress_guid;

			if ( ! guid ) {
				continue;
			}

			libraryVideos.push( {
				guid,
				...( typeof media.title === 'string' && media.title !== '' && { title: media.title } ),
			} );
		}

		if ( ! libraryVideos.length ) {
			setErrorNotice(
				__(
					'None of the selected items are VideoPress videos. Choose videos hosted on VideoPress.',
					'jetpack-videopress-pkg'
				)
			);
			return;
		}

		setAttributes( { videos: [ ...videos, ...libraryVideos ] } );
		setErrorNotice( null );
	};

	const removeVideo = ( index: number ) => {
		setAttributes( { videos: videos.filter( ( _, i ) => i !== index ) } );
		if ( currentIndex >= index && currentIndex > 0 ) {
			setCurrentIndex( currentIndex - 1 );
		}
	};

	const moveVideo = ( index: number, direction: -1 | 1 ) => {
		const target = index + direction;
		if ( target < 0 || target >= videos.length ) {
			return;
		}

		const reordered = [ ...videos ];
		[ reordered[ index ], reordered[ target ] ] = [ reordered[ target ], reordered[ index ] ];
		setAttributes( { videos: reordered } );

		if ( currentIndex === index ) {
			setCurrentIndex( target );
		} else if ( currentIndex === target ) {
			setCurrentIndex( index );
		}
	};

	const addVideoForm = (
		<div className="videopress-playlist-editor__add-container">
			<div className="videopress-playlist-editor__add">
				<TextControl
					__next40pxDefaultSize
					__nextHasNoMarginBottom
					label={ __( 'Add video', 'jetpack-videopress-pkg' ) }
					hideLabelFromVision
					placeholder={ __( 'VideoPress GUID or URL', 'jetpack-videopress-pkg' ) }
					value={ newVideoInput }
					onChange={ ( value: string ) => {
						setNewVideoInput( value );
						setErrorNotice( null );
					} }
					onKeyDown={ event => {
						if ( event.key === 'Enter' ) {
							event.preventDefault();
							addVideo();
						}
					} }
				/>
				<Button
					__next40pxDefaultSize
					variant="secondary"
					onClick={ addVideo }
					isBusy={ isAddingVideo }
					disabled={ isAddingVideo }
				>
					{ __( 'Add to playlist', 'jetpack-videopress-pkg' ) }
				</Button>
				<MediaUploadCheck>
					<MediaUpload
						title={ __( 'Select videos from your VideoPress library', 'jetpack-videopress-pkg' ) }
						onSelect={ addVideosFromLibrary }
						allowedTypes={ VIDEOPRESS_VIDEO_ALLOWED_MEDIA_TYPES }
						multiple
						render={ ( { open }: { open: () => void } ) => (
							<Button __next40pxDefaultSize variant="secondary" onClick={ open }>
								{ __( 'Choose from library', 'jetpack-videopress-pkg' ) }
							</Button>
						) }
					/>
				</MediaUploadCheck>
			</div>
			{ errorNotice && (
				<Notice status="error" isDismissible={ false }>
					{ errorNotice }
				</Notice>
			) }
		</div>
	);

	if ( ! videos.length ) {
		return (
			<div { ...blockProps }>
				<Placeholder
					icon={ VideoPressIcon }
					label={ __( 'VideoPress Playlist', 'jetpack-videopress-pkg' ) }
					instructions={ __(
						'Build a playlist that plays videos in sequence. Choose videos from your VideoPress library, or add them by GUID or URL.',
						'jetpack-videopress-pkg'
					) }
				>
					{ addVideoForm }
				</Placeholder>
			</div>
		);
	}

	return (
		<div { ...blockProps }>
			<InspectorControls>
				<PanelBody title={ __( 'Playlist settings', 'jetpack-videopress-pkg' ) }>
					<ToggleControl
						__nextHasNoMarginBottom
						label={ __( 'Autoplay next video', 'jetpack-videopress-pkg' ) }
						help={ __(
							'Automatically play the next video when the current one ends.',
							'jetpack-videopress-pkg'
						) }
						checked={ autoAdvance }
						onChange={ ( value: boolean ) => setAttributes( { autoAdvance: value } ) }
					/>
					<ToggleControl
						__nextHasNoMarginBottom
						label={ __( 'Loop playlist', 'jetpack-videopress-pkg' ) }
						help={ __(
							'Restart from the first video after the last one ends.',
							'jetpack-videopress-pkg'
						) }
						checked={ loop }
						onChange={ ( value: boolean ) => setAttributes( { loop: value } ) }
					/>
				</PanelBody>
			</InspectorControls>

			{ currentVideo && (
				<div className="videopress-playlist-editor__player-wrapper">
					<iframe
						className="videopress-playlist-editor__player"
						title={ __( 'VideoPress Playlist Player', 'jetpack-videopress-pkg' ) }
						src={ `https://videopress.com/embed/${ currentVideo.guid }?cover=1&preloadContent=metadata` }
						allowFullScreen
						allow="clipboard-write"
					/>
				</div>
			) }

			<ol className="videopress-playlist-editor__items">
				{ videos.map( ( video: PlaylistVideo, index: number ) => (
					<li
						key={ `${ video.guid }-${ index }` }
						className={
							index === currentIndex
								? 'videopress-playlist-editor__item is-current'
								: 'videopress-playlist-editor__item'
						}
					>
						<Button
							className="videopress-playlist-editor__item-select"
							onClick={ () => setCurrentIndex( index ) }
							label={ sprintf(
								/* translators: %d: position of the video in the playlist. */
								__( 'Preview video %d', 'jetpack-videopress-pkg' ),
								index + 1
							) }
						>
							{ index + 1 }.
						</Button>
						<span className="videopress-playlist-editor__item-title">
							{ video.title || video.guid }
						</span>
						<Button
							icon={ chevronUp }
							disabled={ index === 0 }
							onClick={ () => moveVideo( index, -1 ) }
							label={ __( 'Move up', 'jetpack-videopress-pkg' ) }
						/>
						<Button
							icon={ chevronDown }
							disabled={ index === videos.length - 1 }
							onClick={ () => moveVideo( index, 1 ) }
							label={ __( 'Move down', 'jetpack-videopress-pkg' ) }
						/>
						<Button
							icon={ closeSmall }
							onClick={ () => removeVideo( index ) }
							label={ __( 'Remove from playlist', 'jetpack-videopress-pkg' ) }
						/>
					</li>
				) ) }
			</ol>

			{ addVideoForm }
		</div>
	);
}
