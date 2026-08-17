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
import { __, _n, sprintf } from '@wordpress/i18n';
import { closeSmall, dragHandle, Icon } from '@wordpress/icons';
/**
 * Internal dependencies
 */
import { fetchVideoItem } from '../../../lib/fetch-video-item';
import { isVideoPressGuid, pickGUIDFromUrl } from '../../../lib/url';
import { VideoPressIcon } from '../video/components/icons';
import { VIDEOPRESS_VIDEO_ALLOWED_MEDIA_TYPES } from '../video/constants';
import { formatDuration, formatRuntimeLong, qualityLabel, totalDurationMs } from './utils';
import './editor.scss';
/**
 * Types
 */
import type { PlaylistBlockAttributes, PlaylistLayout, PlaylistVideo } from './types';
import type { AdminAjaxQueryAttachmentsResponseItemProps } from '../../../types';
import type { BlockEditProps } from '@wordpress/blocks';

const LAYOUT_OPTIONS: Array< { value: PlaylistLayout; label: string } > = [
	{ value: 'rail', label: __( 'Side rail', 'jetpack-videopress-pkg' ) },
	{ value: 'grid', label: __( 'Grid', 'jetpack-videopress-pkg' ) },
	{ value: 'strip', label: __( 'Strip', 'jetpack-videopress-pkg' ) },
];

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
 * Build a playlist entry's metadata fields from a videos API response.
 *
 * @param videoItem - The API response for one video.
 * @return Metadata fields present in the response.
 */
function metadataFromVideoItem(
	videoItem: Record< string, unknown >
): Omit< PlaylistVideo, 'guid' > {
	const metadata: Omit< PlaylistVideo, 'guid' > = {};

	if ( typeof videoItem?.title === 'string' && videoItem.title !== '' ) {
		metadata.title = decodeEntities( videoItem.title );
	}
	if ( typeof videoItem?.duration === 'number' && videoItem.duration > 0 ) {
		metadata.durationMs = videoItem.duration;
	}
	if ( typeof videoItem?.height === 'number' && videoItem.height > 0 ) {
		metadata.height = videoItem.height;
	}
	if ( typeof videoItem?.poster === 'string' && videoItem.poster !== '' ) {
		metadata.poster = videoItem.poster;
	}

	return metadata;
}

/**
 * Format the "resolution · duration" meta line for a playlist entry.
 *
 * @param video - Playlist entry.
 * @return Meta line, possibly empty.
 */
function metaLine( video: PlaylistVideo ): string {
	return [ qualityLabel( video.height ), formatDuration( video.durationMs ) ]
		.filter( Boolean )
		.join( ' · ' );
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
	const {
		videos,
		autoAdvance,
		loop,
		layout,
		darkSurface,
		showThumbnail,
		showTitle,
		showResolution,
		showDuration,
		showPosition,
		showTotalRuntime,
	} = attributes;
	const [ currentIndex, setCurrentIndex ] = useState( 0 );
	const [ newVideoInput, setNewVideoInput ] = useState( '' );
	const [ errorNotice, setErrorNotice ] = useState< string | null >( null );
	const [ isAddingVideo, setIsAddingVideo ] = useState( false );
	const [ draggedIndex, setDraggedIndex ] = useState< number | null >( null );
	const [ dropTargetIndex, setDropTargetIndex ] = useState< number | null >( null );
	const [ filterText, setFilterText ] = useState( '' );
	const [ pendingDuplicate, setPendingDuplicate ] = useState< PlaylistVideo | null >( null );

	// Always points at the latest videos so async metadata fetches never clobber newer edits.
	const videosRef = useRef( videos );
	videosRef.current = videos;

	// GUIDs with a metadata refresh already started this editor session; they are
	// not re-fetched, so a failed lookup simply keeps the stored fields.
	const metadataFetchesStarted = useRef( new Set< string >() );

	// Entry metadata always mirrors the video data: every entry is refreshed once
	// per editor session, and stored fields are replaced whenever they differ.
	useEffect( () => {
		videos.forEach( video => {
			if ( metadataFetchesStarted.current.has( video.guid ) ) {
				return;
			}

			metadataFetchesStarted.current.add( video.guid );

			fetchVideoItem( { guid: video.guid, isPrivate: false, skipRatingControl: true } )
				.then( videoItem => {
					const metadata = metadataFromVideoItem( videoItem as Record< string, unknown > );
					if ( ! Object.keys( metadata ).length ) {
						return;
					}

					const current = videosRef.current;
					const needsUpdate = current.some(
						entry =>
							entry.guid === video.guid &&
							Object.entries( metadata ).some(
								( [ key, value ] ) => entry[ key as keyof PlaylistVideo ] !== value
							)
					);

					if ( ! needsUpdate ) {
						return;
					}

					setAttributes( {
						videos: current.map( entry =>
							entry.guid === video.guid ? { ...entry, ...metadata } : entry
						),
					} );
				} )
				.catch( () => {
					// Keep the stored fields when the video data isn't reachable.
				} );
		} );
	}, [ videos, setAttributes ] );

	const wrapperClasses = [
		'videopress-playlist-editor',
		`videopress-playlist--${ layout }`,
		darkSurface ? 'is-dark' : '',
		showThumbnail ? '' : 'hide-thumbnails',
		showTitle ? '' : 'hide-titles',
		showResolution ? '' : 'hide-resolution',
		showDuration ? '' : 'hide-duration',
		showPosition ? 'show-position' : '',
		showTotalRuntime ? '' : 'hide-runtime',
	]
		.filter( Boolean )
		.join( ' ' );

	const blockProps = useBlockProps( { className: wrapperClasses } );

	const currentVideo = videos[ currentIndex ] ?? videos[ 0 ];
	const runtime = formatRuntimeLong( totalDurationMs( videos ) );

	const performAdd = async ( guid: string ) => {
		setIsAddingVideo( true );

		// All entry data comes from the video itself; none of it is editable here.
		let metadata: Omit< PlaylistVideo, 'guid' > = {};
		try {
			const videoItem = await fetchVideoItem( { guid, isPrivate: false, skipRatingControl: true } );
			metadata = metadataFromVideoItem( videoItem as Record< string, unknown > );
			// Fresh from the video data; no need for the refresh effect to re-fetch it.
			metadataFetchesStarted.current.add( guid );
		} catch {
			// The entry still works without metadata; the list shows the GUID and
			// the refresh effect retries once more.
		}

		setAttributes( { videos: [ ...videosRef.current, { guid, ...metadata } ] } );
		setNewVideoInput( '' );
		setErrorNotice( null );
		setPendingDuplicate( null );
		setIsAddingVideo( false );
	};

	const addVideo = async () => {
		if ( isAddingVideo ) {
			return;
		}

		const guid = parseVideoInput( newVideoInput );
		if ( ! guid ) {
			setErrorNotice(
				__(
					'No video found at that link. Paste a VideoPress video URL or GUID.',
					'jetpack-videopress-pkg'
				)
			);
			return;
		}

		const existing = videos.find( video => video.guid === guid );
		if ( existing ) {
			setPendingDuplicate( existing );
			return;
		}

		await performAdd( guid );
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

			const poster = media.image?.src ?? media.thumb?.src;

			libraryVideos.push( {
				guid,
				...( typeof media.title === 'string' && media.title !== '' && { title: media.title } ),
				...( typeof poster === 'string' && poster !== '' && { poster } ),
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

	const reorderVideo = ( from: number, to: number ) => {
		if ( from === to || from < 0 || to < 0 || from >= videos.length || to >= videos.length ) {
			return;
		}

		const reordered = [ ...videos ];
		const [ moved ] = reordered.splice( from, 1 );
		reordered.splice( to, 0, moved );
		setAttributes( { videos: reordered } );

		// Keep the canvas preview on the same video it showed before the move.
		if ( currentIndex === from ) {
			setCurrentIndex( to );
		} else if ( from < currentIndex && to >= currentIndex ) {
			setCurrentIndex( currentIndex - 1 );
		} else if ( from > currentIndex && to <= currentIndex ) {
			setCurrentIndex( currentIndex + 1 );
		}
	};

	const addUrlForm = (
		<div className="videopress-playlist-editor__add-row">
			<TextControl
				__next40pxDefaultSize
				__nextHasNoMarginBottom
				label={ __( 'Add a video', 'jetpack-videopress-pkg' ) }
				hideLabelFromVision
				placeholder={ __( 'Paste a video URL', 'jetpack-videopress-pkg' ) }
				value={ newVideoInput }
				onChange={ ( value: string ) => {
					setNewVideoInput( value );
					setErrorNotice( null );
					setPendingDuplicate( null );
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
				variant="primary"
				onClick={ addVideo }
				isBusy={ isAddingVideo }
				disabled={ isAddingVideo }
			>
				{ /* Two separate expressions: a shared ternary would let the minifier
				     merge the __() calls, breaking translation extraction. */ }
				{ isAddingVideo && __( 'Adding…', 'jetpack-videopress-pkg' ) }
				{ ! isAddingVideo && __( 'Add', 'jetpack-videopress-pkg' ) }
			</Button>
		</div>
	);

	const mediaLibraryButton = (
		<MediaUploadCheck>
			<MediaUpload
				title={ __( 'Select videos from your VideoPress library', 'jetpack-videopress-pkg' ) }
				onSelect={ addVideosFromLibrary }
				allowedTypes={ VIDEOPRESS_VIDEO_ALLOWED_MEDIA_TYPES }
				multiple
				render={ ( { open }: { open: () => void } ) => (
					<Button __next40pxDefaultSize variant="secondary" onClick={ open }>
						{ __( 'Media Library', 'jetpack-videopress-pkg' ) }
					</Button>
				) }
			/>
		</MediaUploadCheck>
	);

	// Sidebar list entries keep their original index for reorder/remove even
	// when a filter narrows the visible set.
	const visibleEntries = videos
		.map( ( video: PlaylistVideo, index: number ) => ( { video, index } ) )
		.filter( ( { video } ) => {
			if ( ! filterText ) {
				return true;
			}
			const haystack = `${ video.title ?? '' } ${ video.guid }`.toLowerCase();
			return haystack.includes( filterText.toLowerCase() );
		} );
	const isFiltering = filterText !== '';

	// All playlist management (add, sort, delete) lives in the settings
	// sidebar; the canvas below is a preview of what visitors see.
	const inspectorControls = (
		<InspectorControls>
			<PanelBody title={ __( 'Videos', 'jetpack-videopress-pkg' ) }>
				{ addUrlForm }
				<p className="videopress-playlist-editor__add-help">
					{ __(
						'Any VideoPress video URL or GUID. Title, thumbnail, duration and resolution come from the video data.',
						'jetpack-videopress-pkg'
					) }
				</p>
				<div className="videopress-playlist-editor__add-library">{ mediaLibraryButton }</div>

				{ errorNotice && (
					<Notice
						className="videopress-playlist-editor__notice"
						status="error"
						isDismissible={ false }
					>
						{ errorNotice }
					</Notice>
				) }

				{ pendingDuplicate && (
					<Notice
						className="videopress-playlist-editor__notice"
						status="warning"
						isDismissible={ false }
					>
						{ sprintf(
							/* translators: %s: video title or GUID. */
							__( '“%s” is already in this playlist', 'jetpack-videopress-pkg' ),
							pendingDuplicate.title || pendingDuplicate.guid
						) }
						<div className="videopress-playlist-editor__duplicate-actions">
							<Button
								size="small"
								variant="secondary"
								onClick={ () => performAdd( pendingDuplicate.guid ) }
							>
								{ __( 'Add anyway', 'jetpack-videopress-pkg' ) }
							</Button>
							<Button size="small" variant="tertiary" onClick={ () => setPendingDuplicate( null ) }>
								{ __( 'Cancel', 'jetpack-videopress-pkg' ) }
							</Button>
						</div>
					</Notice>
				) }

				<div className="videopress-playlist-editor__list-header">
					<span className="videopress-playlist-editor__list-title">
						{ __( 'Playlist', 'jetpack-videopress-pkg' ) }
					</span>
					<span className="videopress-playlist-editor__list-count">
						{ videos.length }
						{ runtime ? ` · ${ formatDuration( totalDurationMs( videos ) ) }` : '' }
					</span>
				</div>

				{ videos.length > 8 && (
					<TextControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						className="videopress-playlist-editor__filter"
						label={ __( 'Filter videos', 'jetpack-videopress-pkg' ) }
						hideLabelFromVision
						placeholder={ sprintf(
							/* translators: %d: number of videos in the playlist. */
							__( 'Filter %d videos', 'jetpack-videopress-pkg' ),
							videos.length
						) }
						value={ filterText }
						onChange={ setFilterText }
					/>
				) }

				{ /* A listbox: the options take focus and respond to arrow keys for reordering. */ }
				<ul
					className="videopress-playlist-editor__manage-list"
					role="listbox"
					aria-label={ __( 'Playlist videos', 'jetpack-videopress-pkg' ) }
				>
					{ visibleEntries.map( ( { video, index } ) => {
						const classes = [ 'videopress-playlist-editor__manage-item' ];
						if ( index === draggedIndex ) {
							classes.push( 'is-dragging' );
						}
						if ( index === dropTargetIndex && index !== draggedIndex ) {
							classes.push( 'is-drop-target' );
						}

						return (
							<li
								key={ `${ video.guid }-${ index }` }
								className={ classes.join( ' ' ) }
								role="option"
								aria-selected={ index === draggedIndex }
								draggable={ ! isFiltering }
								tabIndex={ 0 }
								aria-label={ sprintf(
									/* translators: %d: position of the video in the playlist. */
									__( 'Video %d. Drag to reorder, or press up or down.', 'jetpack-videopress-pkg' ),
									index + 1
								) }
								onKeyDown={ event => {
									if ( isFiltering ) {
										return;
									}
									if ( event.key === 'ArrowUp' ) {
										event.preventDefault();
										reorderVideo( index, index - 1 );
									} else if ( event.key === 'ArrowDown' ) {
										event.preventDefault();
										reorderVideo( index, index + 1 );
									}
								} }
								onDragStart={ event => {
									setDraggedIndex( index );
									event.dataTransfer?.setData( 'text/plain', String( index ) );
									if ( event.dataTransfer ) {
										event.dataTransfer.effectAllowed = 'move';
									}
								} }
								onDragOver={ event => {
									event.preventDefault();
									if ( event.dataTransfer ) {
										event.dataTransfer.dropEffect = 'move';
									}
									if ( draggedIndex !== null && index !== draggedIndex ) {
										setDropTargetIndex( index );
									}
								} }
								onDragLeave={ () => {
									if ( dropTargetIndex === index ) {
										setDropTargetIndex( null );
									}
								} }
								onDrop={ event => {
									event.preventDefault();
									if ( draggedIndex !== null ) {
										reorderVideo( draggedIndex, index );
									}
									setDraggedIndex( null );
									setDropTargetIndex( null );
								} }
								onDragEnd={ () => {
									setDraggedIndex( null );
									setDropTargetIndex( null );
								} }
							>
								<span className="videopress-playlist-editor__manage-item-handle">
									<Icon icon={ dragHandle } size={ 16 } />
								</span>
								<span className="videopress-playlist-editor__manage-item-index">
									{ String( index + 1 ).padStart( 2, '0' ) }
								</span>
								<span className="videopress-playlist-editor__manage-item-thumb">
									{ video.poster && <img src={ video.poster } alt="" loading="lazy" /> }
								</span>
								<span className="videopress-playlist-editor__manage-item-text">
									<span className="videopress-playlist-editor__manage-item-title">
										{ video.title || video.guid }
									</span>
									{ metaLine( video ) && (
										<span className="videopress-playlist-editor__manage-item-meta">
											{ metaLine( video ) }
										</span>
									) }
								</span>
								<Button
									className="videopress-playlist-editor__manage-item-remove"
									size="small"
									icon={ closeSmall }
									onClick={ () => removeVideo( index ) }
									label={ __( 'Remove from playlist', 'jetpack-videopress-pkg' ) }
								/>
							</li>
						);
					} ) }
					{ isAddingVideo && (
						<li className="videopress-playlist-editor__manage-item is-loading" aria-hidden="true">
							<span className="videopress-playlist-editor__manage-item-thumb" />
							<span className="videopress-playlist-editor__manage-item-text">
								<span className="videopress-playlist-editor__manage-item-meta">
									{ __( 'Reading metadata…', 'jetpack-videopress-pkg' ) }
								</span>
							</span>
						</li>
					) }
				</ul>
				<p className="videopress-playlist-editor__reorder-help">
					{ __(
						'Drag to reorder, or focus an item and press ↑ / ↓. × removes the video.',
						'jetpack-videopress-pkg'
					) }
				</p>
			</PanelBody>

			<PanelBody title={ __( 'Layout & playback', 'jetpack-videopress-pkg' ) }>
				<div
					className="videopress-playlist-editor__layout-picker"
					role="group"
					aria-label={ __( 'Layout', 'jetpack-videopress-pkg' ) }
				>
					{ LAYOUT_OPTIONS.map( option => (
						<Button
							key={ option.value }
							variant={ layout === option.value ? 'primary' : 'secondary' }
							isPressed={ layout === option.value }
							onClick={ () => setAttributes( { layout: option.value } ) }
						>
							{ option.label }
						</Button>
					) ) }
				</div>
				<ToggleControl
					__nextHasNoMarginBottom
					label={ __( 'Dark player surface', 'jetpack-videopress-pkg' ) }
					checked={ darkSurface }
					onChange={ ( value: boolean ) => setAttributes( { darkSurface: value } ) }
				/>
				<ToggleControl
					__nextHasNoMarginBottom
					label={ __( 'Autoplay next', 'jetpack-videopress-pkg' ) }
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

			<PanelBody title={ __( 'Show on each entry', 'jetpack-videopress-pkg' ) }>
				<ToggleControl
					__nextHasNoMarginBottom
					label={ __( 'Thumbnail', 'jetpack-videopress-pkg' ) }
					checked={ showThumbnail }
					onChange={ ( value: boolean ) => setAttributes( { showThumbnail: value } ) }
				/>
				<ToggleControl
					__nextHasNoMarginBottom
					label={ __( 'Title', 'jetpack-videopress-pkg' ) }
					checked={ showTitle }
					onChange={ ( value: boolean ) => setAttributes( { showTitle: value } ) }
				/>
				<ToggleControl
					__nextHasNoMarginBottom
					label={ __( 'Resolution', 'jetpack-videopress-pkg' ) }
					checked={ showResolution }
					onChange={ ( value: boolean ) => setAttributes( { showResolution: value } ) }
				/>
				<ToggleControl
					__nextHasNoMarginBottom
					label={ __( 'Duration', 'jetpack-videopress-pkg' ) }
					checked={ showDuration }
					onChange={ ( value: boolean ) => setAttributes( { showDuration: value } ) }
				/>
				<ToggleControl
					__nextHasNoMarginBottom
					label={ __( 'Position number', 'jetpack-videopress-pkg' ) }
					checked={ showPosition }
					onChange={ ( value: boolean ) => setAttributes( { showPosition: value } ) }
				/>
				<ToggleControl
					__nextHasNoMarginBottom
					label={ __( 'Total runtime in header', 'jetpack-videopress-pkg' ) }
					checked={ showTotalRuntime }
					onChange={ ( value: boolean ) => setAttributes( { showTotalRuntime: value } ) }
				/>
			</PanelBody>
		</InspectorControls>
	);

	if ( ! videos.length ) {
		return (
			<div { ...blockProps }>
				{ inspectorControls }
				<Placeholder
					icon={ VideoPressIcon }
					label={ __( 'Build a video playlist', 'jetpack-videopress-pkg' ) }
					instructions={ __(
						'Paste a link, or pick a video already in your media library. Title, thumbnail, duration and resolution are read for you.',
						'jetpack-videopress-pkg'
					) }
				>
					<div className="videopress-playlist-editor__placeholder-form">
						{ addUrlForm }
						{ errorNotice && (
							<Notice
								className="videopress-playlist-editor__notice"
								status="error"
								isDismissible={ false }
							>
								{ errorNotice }
							</Notice>
						) }
						<div className="videopress-playlist-editor__placeholder-divider">
							<span>{ __( 'or', 'jetpack-videopress-pkg' ) }</span>
						</div>
						{ mediaLibraryButton }
					</div>
				</Placeholder>
			</div>
		);
	}

	return (
		<div { ...blockProps }>
			{ inspectorControls }

			<div className="videopress-playlist__header">
				<span className="videopress-playlist__count">
					{ sprintf(
						/* translators: %d: number of videos in the playlist. */
						_n( '%d video', '%d videos', videos.length, 'jetpack-videopress-pkg' ),
						videos.length
					) }
				</span>
				{ runtime && <span className="videopress-playlist__runtime">{ runtime }</span> }
			</div>

			<div className="videopress-playlist__body">
				{ currentVideo && (
					<div className="videopress-playlist__player-wrapper">
						<iframe
							className="videopress-playlist__player"
							title={ __( 'VideoPress Playlist Player', 'jetpack-videopress-pkg' ) }
							src={ `https://videopress.com/embed/${ currentVideo.guid }?cover=1&preloadContent=metadata` }
							allowFullScreen
							allow="clipboard-write"
						/>
					</div>
				) }

				<ul className="videopress-playlist__items">
					{ videos.map( ( video: PlaylistVideo, index: number ) => (
						<li key={ `${ video.guid }-${ index }` }>
							<button
								type="button"
								className={
									index === currentIndex
										? 'videopress-playlist__item is-current'
										: 'videopress-playlist__item'
								}
								onClick={ () => setCurrentIndex( index ) }
								aria-label={ sprintf(
									/* translators: %d: position of the video in the playlist. */
									__( 'Preview video %d', 'jetpack-videopress-pkg' ),
									index + 1
								) }
							>
								<span className="videopress-playlist__item-thumb">
									{ video.poster && <img src={ video.poster } alt="" loading="lazy" /> }
									<span className="videopress-playlist__item-index">{ index + 1 }</span>
									{ formatDuration( video.durationMs ) && (
										<span className="videopress-playlist__item-thumb-duration">
											{ formatDuration( video.durationMs ) }
										</span>
									) }
								</span>
								<span className="videopress-playlist__item-text">
									<span className="videopress-playlist__item-title">
										{ video.title || video.guid }
									</span>
									<span className="videopress-playlist__item-meta">
										{ qualityLabel( video.height ) && (
											<span className="videopress-playlist__item-badge">
												{ qualityLabel( video.height ) }
											</span>
										) }
										{ formatDuration( video.durationMs ) && (
											<span className="videopress-playlist__item-duration">
												{ formatDuration( video.durationMs ) }
											</span>
										) }
									</span>
								</span>
							</button>
						</li>
					) ) }
				</ul>
			</div>
		</div>
	);
}
