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
import { useState } from '@wordpress/element';
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
import {
	formatRuntime,
	formatTimecode,
	moveEntry,
	playlistEmbedUrl,
	playlistRuntimeMs,
	resolutionLabel,
} from './utils';
import './editor.scss';
/**
 * Types
 */
import type { PlaylistAttributes, PlaylistEntry, PlaylistLayout } from './types';
import type { AdminAjaxQueryAttachmentsResponseItemProps } from '../../../types';
import type { BlockEditProps } from '@wordpress/blocks';

/**
 * Playlists longer than this get a filter input and per-row position
 * numbers in the sidebar manager, matching the long-playlist design.
 */
const LONG_PLAYLIST_THRESHOLD = 8;

type LayoutOption = { value: PlaylistLayout; label: string };

const LAYOUT_OPTIONS: LayoutOption[] = [
	{ value: 'side-rail', label: __( 'Side rail', 'jetpack-videopress-pkg' ) },
	{ value: 'grid', label: __( 'Grid', 'jetpack-videopress-pkg' ) },
	{ value: 'strip', label: __( 'Strip', 'jetpack-videopress-pkg' ) },
];

/**
 * Resolve raw user input (a VideoPress URL or a bare GUID) to a GUID.
 *
 * @param input - Raw user input.
 * @return The GUID, or null when the input isn't a VideoPress video reference.
 */
export function guidFromInput( input: string ): string | null {
	const value = input.trim();
	if ( ! value ) {
		return null;
	}

	if ( isVideoPressGuid( value ) ) {
		return value;
	}

	return pickGUIDFromUrl( value );
}

/**
 * Build a playlist entry from a videos API response item.
 *
 * @param guid - The video GUID.
 * @param item - The videos API response.
 * @return Playlist entry with the metadata the API reported.
 */
function entryFromApiResponse( guid: string, item: Record< string, unknown > ): PlaylistEntry {
	const entry: PlaylistEntry = { guid };

	if ( typeof item?.title === 'string' && item.title ) {
		entry.title = decodeEntities( item.title );
	}

	// The API isn't strict about numeric types, so coerce rather than type-check.
	const duration = Number( item?.duration );
	if ( Number.isFinite( duration ) && duration > 0 ) {
		entry.durationMs = duration;
	}
	const height = Number( item?.height );
	if ( Number.isFinite( height ) && height > 0 ) {
		entry.height = height;
	}

	if ( typeof item?.poster === 'string' && item.poster ) {
		entry.poster = item.poster;
	}

	return entry;
}

/**
 * Format the "1080p · 12:04" meta line of an entry.
 *
 * @param entry - Playlist entry.
 * @return Meta line; empty when nothing is known.
 */
function entryMetaLine( entry: PlaylistEntry ): string {
	return [ resolutionLabel( entry.height ), formatTimecode( entry.durationMs ) ]
		.filter( Boolean )
		.join( ' · ' );
}

/**
 * The front-end-mirroring preview rendered in the editor canvas.
 *
 * @param props              - Component props.
 * @param props.attributes   - Block attributes.
 * @param props.currentIndex - Index of the entry shown in the player.
 * @param props.onSelect     - Called with an entry index when it is clicked.
 * @return Preview element.
 */
function PlaylistPreview( {
	attributes,
	currentIndex,
	onSelect,
}: {
	attributes: PlaylistAttributes;
	currentIndex: number;
	onSelect: ( index: number ) => void;
} ) {
	const { videos, showPositionNumber, showTotalRuntime } = attributes;
	const current = videos[ currentIndex ];
	const runtime = formatRuntime( playlistRuntimeMs( videos ) );
	const countLabel = sprintf(
		/* translators: %d: number of videos in the playlist. */
		_n( '%d video', '%d videos', videos.length, 'jetpack-videopress-pkg' ),
		videos.length
	);
	const nowPosition = sprintf(
		/* translators: 1: position of the current video. 2: number of videos in the playlist. */
		__( '%1$d of %2$d', 'jetpack-videopress-pkg' ),
		currentIndex + 1,
		videos.length
	);

	return (
		<>
			<header className="videopress-playlist__header">
				<span className="videopress-playlist__count">{ countLabel }</span>
				{ showTotalRuntime && runtime && (
					<span className="videopress-playlist__runtime">{ runtime }</span>
				) }
			</header>

			<div className="videopress-playlist__body">
				<div className="videopress-playlist__stage">
					<div className="videopress-playlist__player">
						<iframe
							className="videopress-playlist__iframe"
							title={ current.title || __( 'Video Playlist player', 'jetpack-videopress-pkg' ) }
							src={ playlistEmbedUrl( current.guid, false ) }
							allowFullScreen
							allow="clipboard-write"
						/>
					</div>
					<div className="videopress-playlist__now">
						<span className="videopress-playlist__now-title">
							{ current.title || current.guid }
						</span>
						<span className="videopress-playlist__now-meta">
							<span className="videopress-playlist__now-position">{ nowPosition }</span>
							{ entryMetaLine( current ) && (
								<span className="videopress-playlist__now-details">
									{ entryMetaLine( current ) }
								</span>
							) }
						</span>
						{ showTotalRuntime && runtime && (
							<span className="videopress-playlist__now-runtime">
								{ `${ countLabel } · ${ runtime }` }
							</span>
						) }
					</div>
				</div>

				<div className="videopress-playlist__list">
					<div className="videopress-playlist__list-header">
						<span className="videopress-playlist__list-label videopress-playlist__list-label--rail">
							{ __( 'Up next', 'jetpack-videopress-pkg' ) }
						</span>
						<span className="videopress-playlist__list-label videopress-playlist__list-label--strip">
							{ sprintf(
								/* translators: %d: number of videos in the playlist. */
								__( 'Playlist — %d videos', 'jetpack-videopress-pkg' ),
								videos.length
							) }
						</span>
						<span className="videopress-playlist__list-progress">
							{ sprintf(
								/* translators: 1: position of the current video. 2: number of videos. 3: total playlist timecode. */
								__( '%1$d / %2$d · %3$s total', 'jetpack-videopress-pkg' ),
								currentIndex + 1,
								videos.length,
								formatTimecode( playlistRuntimeMs( videos ) )
							) }
						</span>
					</div>
					<ol className="videopress-playlist__entries">
						{ videos.map( ( entry, index ) => (
							<li className="videopress-playlist__entry" key={ `${ entry.guid }-${ index }` }>
								<button
									type="button"
									className={
										index === currentIndex
											? 'videopress-playlist__select is-current'
											: 'videopress-playlist__select'
									}
									aria-current={ index === currentIndex ? 'true' : undefined }
									onClick={ () => onSelect( index ) }
								>
									{ showPositionNumber && (
										<span className="videopress-playlist__entry-number">
											{ String( index + 1 ).padStart( 2, '0' ) }
										</span>
									) }
									<span className="videopress-playlist__entry-thumb">
										{ entry.poster && <img src={ entry.poster } alt="" loading="lazy" /> }
										<span className="videopress-playlist__entry-flag">
											{ __( 'Playing', 'jetpack-videopress-pkg' ) }
										</span>
										{ formatTimecode( entry.durationMs ) && (
											<span className="videopress-playlist__entry-time">
												{ formatTimecode( entry.durationMs ) }
											</span>
										) }
									</span>
									<span className="videopress-playlist__entry-body">
										<span className="videopress-playlist__entry-title">
											{ entry.title || entry.guid }
										</span>
										<span className="videopress-playlist__entry-meta">
											{ resolutionLabel( entry.height ) && (
												<span className="videopress-playlist__entry-resolution">
													{ resolutionLabel( entry.height ) }
												</span>
											) }
											{ formatTimecode( entry.durationMs ) && (
												<span className="videopress-playlist__entry-duration">
													{ formatTimecode( entry.durationMs ) }
												</span>
											) }
										</span>
									</span>
								</button>
							</li>
						) ) }
					</ol>
				</div>
			</div>

			<p className="videopress-playlist-editor__canvas-hint">
				{ __(
					'The canvas preview mirrors the sidebar order live — the block is not editable in place.',
					'jetpack-videopress-pkg'
				) }
			</p>
		</>
	);
}

/**
 * Video Playlist block edit component.
 *
 * The canvas is a live, non-editable preview of the front end; every
 * playlist operation (add, reorder, remove, display options) lives in the
 * block settings sidebar.
 *
 * @param props               - Block edit props.
 * @param props.attributes    - Block attributes.
 * @param props.setAttributes - Attribute setter.
 * @return Edit component.
 */
export default function PlaylistEdit( {
	attributes,
	setAttributes,
}: BlockEditProps< PlaylistAttributes > ) {
	const {
		videos,
		layout,
		darkPlayer,
		autoplayNext,
		showThumbnail,
		showTitle,
		showResolution,
		showDuration,
		showPositionNumber,
		showTotalRuntime,
	} = attributes;

	const [ previewIndex, setPreviewIndex ] = useState( 0 );
	const [ urlInput, setUrlInput ] = useState( '' );
	const [ isAdding, setIsAdding ] = useState( false );
	const [ addError, setAddError ] = useState< string | null >( null );
	const [ duplicateGuid, setDuplicateGuid ] = useState< string | null >( null );
	const [ filter, setFilter ] = useState( '' );
	const [ dragIndex, setDragIndex ] = useState< number | null >( null );
	const [ dropIndex, setDropIndex ] = useState< number | null >( null );

	const currentIndex = Math.min( previewIndex, Math.max( 0, videos.length - 1 ) );
	const isLongPlaylist = videos.length > LONG_PLAYLIST_THRESHOLD;
	const isFiltering = isLongPlaylist && filter.trim() !== '';

	const wrapperClasses = [
		'videopress-playlist',
		`is-layout-${ layout }`,
		darkPlayer ? 'is-dark' : '',
		showThumbnail ? '' : 'hide-thumbnails',
		showTitle ? '' : 'hide-titles',
		showResolution ? '' : 'hide-resolutions',
		showDuration ? '' : 'hide-durations',
		showTotalRuntime ? '' : 'hide-runtime',
	]
		.filter( Boolean )
		.join( ' ' );

	const blockProps = useBlockProps( {
		className: videos.length ? wrapperClasses : 'videopress-playlist is-empty',
	} );

	const clearFeedback = () => {
		setAddError( null );
		setDuplicateGuid( null );
	};

	const appendVideo = async ( guid: string ) => {
		setIsAdding( true );
		clearFeedback();

		try {
			const item = await fetchVideoItem( { guid, isPrivate: false, skipRatingControl: true } );
			setAttributes( {
				videos: [ ...videos, entryFromApiResponse( guid, item as Record< string, unknown > ) ],
			} );
			setUrlInput( '' );
		} catch {
			setAddError(
				__(
					'No video found at that link. Check the URL, or paste the share link of a video in your VideoPress library.',
					'jetpack-videopress-pkg'
				)
			);
		} finally {
			setIsAdding( false );
		}
	};

	const addFromInput = () => {
		if ( isAdding ) {
			return;
		}

		const guid = guidFromInput( urlInput );
		if ( ! guid ) {
			setDuplicateGuid( null );
			setAddError(
				__(
					'No video found at that link. Check the URL, or paste a VideoPress video URL or GUID.',
					'jetpack-videopress-pkg'
				)
			);
			return;
		}

		if ( videos.some( entry => entry.guid === guid ) ) {
			setAddError( null );
			setDuplicateGuid( guid );
			return;
		}

		appendVideo( guid );
	};

	const addFromLibrary = (
		selection:
			| AdminAjaxQueryAttachmentsResponseItemProps
			| AdminAjaxQueryAttachmentsResponseItemProps[]
	) => {
		const items = Array.isArray( selection ) ? selection : [ selection ];
		const entries: PlaylistEntry[] = [];

		for ( const item of items ) {
			// Depending on the endpoint, `videopress_guid` is an array or a string.
			const guid = Array.isArray( item?.videopress_guid )
				? item.videopress_guid[ 0 ]
				: item?.videopress_guid;

			if ( ! guid ) {
				continue;
			}

			const entry: PlaylistEntry = { guid };
			if ( typeof item.title === 'string' && item.title ) {
				entry.title = decodeEntities( item.title );
			}
			const poster = item.image?.src || item.thumb?.src;
			if ( typeof poster === 'string' && poster ) {
				entry.poster = poster;
			}
			// Attachments know the video height, so the resolution badge
			// shows for library picks too (240p included).
			const height = Number( item.height );
			if ( Number.isFinite( height ) && height > 0 ) {
				entry.height = height;
			}

			entries.push( entry );
		}

		if ( ! entries.length ) {
			setAddError(
				__(
					'None of the selected items are VideoPress videos. Pick videos hosted on VideoPress.',
					'jetpack-videopress-pkg'
				)
			);
			return;
		}

		clearFeedback();
		setAttributes( { videos: [ ...videos, ...entries ] } );
	};

	const removeVideo = ( index: number ) => {
		setAttributes( { videos: videos.filter( ( _, i ) => i !== index ) } );
		if ( currentIndex > index || ( currentIndex === index && currentIndex > 0 ) ) {
			setPreviewIndex( currentIndex - 1 );
		}
	};

	const reorderVideo = ( from: number, to: number ) => {
		const next = moveEntry( videos, from, to );
		if ( next === videos ) {
			return;
		}

		setAttributes( { videos: next } );

		// Keep the canvas preview on the entry it was showing before the move.
		if ( currentIndex === from ) {
			setPreviewIndex( to );
		} else if ( from < currentIndex && to >= currentIndex ) {
			setPreviewIndex( currentIndex - 1 );
		} else if ( from > currentIndex && to <= currentIndex ) {
			setPreviewIndex( currentIndex + 1 );
		}
	};

	const addForm = (
		<div className="videopress-playlist-editor__add-row">
			<TextControl
				__next40pxDefaultSize
				__nextHasNoMarginBottom
				label={ __( 'Add a video', 'jetpack-videopress-pkg' ) }
				hideLabelFromVision
				placeholder={ __( 'Paste a video URL', 'jetpack-videopress-pkg' ) }
				value={ urlInput }
				onChange={ ( value: string ) => {
					setUrlInput( value );
					clearFeedback();
				} }
				onKeyDown={ ( event: React.KeyboardEvent ) => {
					if ( event.key === 'Enter' ) {
						event.preventDefault();
						addFromInput();
					}
				} }
			/>
			<Button
				__next40pxDefaultSize
				variant="primary"
				isBusy={ isAdding }
				aria-disabled={ isAdding }
				onClick={ addFromInput }
			>
				{ /* Kept as two expressions so minification can't merge the two
				     __() calls into one, which would break string extraction. */ }
				{ isAdding && __( 'Adding…', 'jetpack-videopress-pkg' ) }
				{ ! isAdding && __( 'Add', 'jetpack-videopress-pkg' ) }
			</Button>
		</div>
	);

	const mediaLibraryButton = (
		<MediaUploadCheck>
			<MediaUpload
				title={ __( 'Select videos to add', 'jetpack-videopress-pkg' ) }
				onSelect={ addFromLibrary }
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

	const notices = (
		<>
			{ addError && (
				<Notice
					className="videopress-playlist-editor__notice"
					status="error"
					isDismissible={ false }
				>
					{ addError }
				</Notice>
			) }
			{ duplicateGuid && (
				<Notice
					className="videopress-playlist-editor__notice"
					status="warning"
					isDismissible={ false }
				>
					{ sprintf(
						/* translators: %s: title (or GUID) of the video. */
						__( '“%s” is already in this playlist', 'jetpack-videopress-pkg' ),
						videos.find( entry => entry.guid === duplicateGuid )?.title || duplicateGuid
					) }
					<span className="videopress-playlist-editor__duplicate-actions">
						<Button size="small" variant="secondary" onClick={ () => appendVideo( duplicateGuid ) }>
							{ __( 'Add anyway', 'jetpack-videopress-pkg' ) }
						</Button>
						<Button size="small" variant="tertiary" onClick={ () => setDuplicateGuid( null ) }>
							{ __( 'Cancel', 'jetpack-videopress-pkg' ) }
						</Button>
					</span>
				</Notice>
			) }
		</>
	);

	const filteredRows = videos
		.map( ( entry, index ) => ( { entry, index } ) )
		.filter( ( { entry } ) => {
			if ( ! isFiltering ) {
				return true;
			}
			return `${ entry.title ?? '' } ${ entry.guid }`
				.toLowerCase()
				.includes( filter.trim().toLowerCase() );
		} );

	const inspectorControls = (
		<InspectorControls>
			<PanelBody title={ __( 'Add a video', 'jetpack-videopress-pkg' ) }>
				{ addForm }
				<p className="videopress-playlist-editor__help">
					{ __(
						'Any VideoPress video URL or GUID. Title, thumbnail, duration and resolution come from the video data.',
						'jetpack-videopress-pkg'
					) }
				</p>
				{ mediaLibraryButton }
				{ notices }
			</PanelBody>

			<PanelBody title={ __( 'Playlist', 'jetpack-videopress-pkg' ) }>
				<div className="videopress-playlist-editor__list-summary">
					<span>
						{ sprintf(
							/* translators: %d: number of videos in the playlist. */
							_n( '%d video', '%d videos', videos.length, 'jetpack-videopress-pkg' ),
							videos.length
						) }
					</span>
					{ formatTimecode( playlistRuntimeMs( videos ) ) && (
						<span className="videopress-playlist-editor__list-runtime">
							{ formatTimecode( playlistRuntimeMs( videos ) ) }
						</span>
					) }
				</div>

				{ isLongPlaylist && (
					<TextControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Filter videos', 'jetpack-videopress-pkg' ) }
						hideLabelFromVision
						placeholder={ sprintf(
							/* translators: %d: number of videos in the playlist. */
							__( 'Filter %d videos', 'jetpack-videopress-pkg' ),
							videos.length
						) }
						value={ filter }
						onChange={ setFilter }
					/>
				) }

				<ol
					className="videopress-playlist-editor__rows"
					aria-label={ __( 'Playlist videos', 'jetpack-videopress-pkg' ) }
				>
					{ filteredRows.map( ( { entry, index } ) => {
						const rowClasses = [ 'videopress-playlist-editor__row' ];
						if ( dragIndex === index ) {
							rowClasses.push( 'is-dragging' );
						}
						if ( dropIndex === index && dragIndex !== null && dragIndex !== index ) {
							rowClasses.push( 'is-drop-target' );
						}

						return (
							<li
								key={ `${ entry.guid }-${ index }` }
								className={ rowClasses.join( ' ' ) }
								draggable={ ! isFiltering }
								onDragStart={ ( event: React.DragEvent ) => {
									setDragIndex( index );
									event.dataTransfer.effectAllowed = 'move';
									event.dataTransfer.setData( 'text/plain', String( index ) );
								} }
								onDragOver={ ( event: React.DragEvent ) => {
									event.preventDefault();
									event.dataTransfer.dropEffect = 'move';
									if ( dragIndex !== null && dragIndex !== index ) {
										setDropIndex( index );
									}
								} }
								onDragLeave={ () => {
									setDropIndex( current => ( current === index ? null : current ) );
								} }
								onDrop={ ( event: React.DragEvent ) => {
									event.preventDefault();
									if ( dragIndex !== null ) {
										reorderVideo( dragIndex, index );
									}
									setDragIndex( null );
									setDropIndex( null );
								} }
								onDragEnd={ () => {
									setDragIndex( null );
									setDropIndex( null );
								} }
							>
								{ ! isFiltering && (
									<Button
										className="videopress-playlist-editor__row-handle"
										icon={ <Icon icon={ dragHandle } size={ 16 } /> }
										label={ sprintf(
											/* translators: %s: title (or GUID) of the video. */
											__( 'Reorder “%s”. Press up or down to move it.', 'jetpack-videopress-pkg' ),
											entry.title || entry.guid
										) }
										onKeyDown={ ( event: React.KeyboardEvent ) => {
											if ( event.key === 'ArrowUp' ) {
												event.preventDefault();
												reorderVideo( index, index - 1 );
											} else if ( event.key === 'ArrowDown' ) {
												event.preventDefault();
												reorderVideo( index, index + 1 );
											}
										} }
									/>
								) }
								{ isLongPlaylist && (
									<span className="videopress-playlist-editor__row-number">
										{ String( index + 1 ).padStart( 2, '0' ) }
									</span>
								) }
								<span className="videopress-playlist-editor__row-thumb">
									{ entry.poster && <img src={ entry.poster } alt="" loading="lazy" /> }
								</span>
								<span className="videopress-playlist-editor__row-body">
									<span className="videopress-playlist-editor__row-title">
										{ entry.title || entry.guid }
									</span>
									{ entryMetaLine( entry ) && (
										<span className="videopress-playlist-editor__row-meta">
											{ entryMetaLine( entry ) }
										</span>
									) }
								</span>
								<Button
									className="videopress-playlist-editor__row-remove"
									size="small"
									icon={ closeSmall }
									label={ sprintf(
										/* translators: %s: title (or GUID) of the video. */
										__( 'Remove “%s” from the playlist', 'jetpack-videopress-pkg' ),
										entry.title || entry.guid
									) }
									onClick={ () => removeVideo( index ) }
								/>
							</li>
						);
					} ) }
					{ isAdding && (
						<li
							className="videopress-playlist-editor__row is-loading"
							data-testid="playlist-loading-row"
							aria-hidden="true"
						>
							<span className="videopress-playlist-editor__row-thumb" />
							<span className="videopress-playlist-editor__row-body">
								<span className="videopress-playlist-editor__row-meta">
									{ __( 'Reading metadata…', 'jetpack-videopress-pkg' ) }
								</span>
							</span>
						</li>
					) }
				</ol>
				{ videos.length > 1 && (
					<p className="videopress-playlist-editor__help">
						{ __(
							'Drag to reorder, or focus a handle and press ↑ / ↓. × removes the video.',
							'jetpack-videopress-pkg'
						) }
					</p>
				) }
			</PanelBody>

			<PanelBody title={ __( 'Layout', 'jetpack-videopress-pkg' ) }>
				<div
					className="videopress-playlist-editor__layouts"
					role="group"
					aria-label={ __( 'Layout', 'jetpack-videopress-pkg' ) }
				>
					{ LAYOUT_OPTIONS.map( option => (
						<button
							key={ option.value }
							type="button"
							className={
								layout === option.value
									? 'videopress-playlist-editor__layout is-selected'
									: 'videopress-playlist-editor__layout'
							}
							aria-pressed={ layout === option.value }
							onClick={ () => setAttributes( { layout: option.value } ) }
						>
							<span
								className={ `videopress-playlist-editor__layout-sketch is-${ option.value }` }
								aria-hidden="true"
							>
								<i />
								<i />
								<i />
								<i />
							</span>
							{ option.label }
						</button>
					) ) }
				</div>
				<ToggleControl
					__nextHasNoMarginBottom
					label={ __( 'Dark player surface', 'jetpack-videopress-pkg' ) }
					checked={ darkPlayer }
					onChange={ ( value: boolean ) => setAttributes( { darkPlayer: value } ) }
				/>
				<ToggleControl
					__nextHasNoMarginBottom
					label={ __( 'Autoplay next', 'jetpack-videopress-pkg' ) }
					help={ __(
						'Play the next video automatically when one ends.',
						'jetpack-videopress-pkg'
					) }
					checked={ autoplayNext }
					onChange={ ( value: boolean ) => setAttributes( { autoplayNext: value } ) }
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
					checked={ showPositionNumber }
					onChange={ ( value: boolean ) => setAttributes( { showPositionNumber: value } ) }
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
					<div className="videopress-playlist-editor__placeholder">
						{ addForm }
						{ notices }
						{ isAdding && (
							<p className="videopress-playlist-editor__help" data-testid="playlist-loading-row">
								{ __( 'Reading metadata…', 'jetpack-videopress-pkg' ) }
							</p>
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
		<figure { ...blockProps }>
			{ inspectorControls }
			<PlaylistPreview
				attributes={ attributes }
				currentIndex={ currentIndex }
				onSelect={ setPreviewIndex }
			/>
		</figure>
	);
}
