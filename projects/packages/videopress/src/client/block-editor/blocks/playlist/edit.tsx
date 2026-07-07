/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { BlockIcon, InspectorControls, useBlockProps } from '@wordpress/block-editor';
import {
	PanelBody,
	Placeholder,
	SelectControl,
	Spinner,
	ToggleControl,
} from '@wordpress/components';
import { useEffect, useMemo, useState } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';
import clsx from 'clsx';
/**
 * Internal dependencies
 */
import { toPlaylist } from '../../../../dashboard/types/playlist';
import { orderPlaylistVideos } from '../../../lib/playlist-order';
import { VideoPressIcon } from '../video/components/icons';
import PlaylistPicker from './components/playlist-picker';
import './editor.scss';
/**
 * Types
 */
import type { ApiPlaylistTerm, Playlist } from '../../../../dashboard/types/playlist';
import type { ReactNode } from 'react';

export type PlaylistBlockAttributes = {
	playlistId?: number;
	layout?: 'list' | 'grid';
	showHeader?: boolean;
	autoplayNext?: boolean;
	align?: string;
	anchor?: string;
	className?: string;
};

type PlaylistEditProps = {
	attributes: PlaylistBlockAttributes;
	setAttributes: ( attributes: Partial< PlaylistBlockAttributes > ) => void;
};

// The slice of a /wp/v2/media attachment the static preview consumes. Poster
// and duration ride in media_details.videopress, like the dashboard's member
// fetch (use-playlist-videos.ts).
type ApiMediaItem = {
	id: number;
	title?: { rendered?: string };
	slug?: string;
	media_details?: {
		videopress?: { duration?: number; poster?: string };
	};
};

type PreviewVideo = {
	id: number;
	title: string;
	poster: string;
	durationMs: number;
};

type PlaylistsError = 'forbidden' | 'error';

const BLOCK_LABEL = __( 'VideoPress Playlist', 'jetpack-videopress-pkg' );

/**
 * Format a millisecond duration as m:ss (or h:mm:ss past the hour).
 *
 * JS twin of Playlist_Block::format_duration() so the editor preview and the
 * frontend render show the same duration strings.
 *
 * @param {number} durationMs - Duration in milliseconds.
 * @return {string} The formatted duration.
 */
function formatDuration( durationMs: number ): string {
	const totalSeconds = Math.floor( durationMs / 1000 );
	const hours = Math.floor( totalSeconds / 3600 );
	const minutes = Math.floor( ( totalSeconds % 3600 ) / 60 );
	const seconds = totalSeconds % 60;

	if ( hours > 0 ) {
		return `${ hours }:${ String( minutes ).padStart( 2, '0' ) }:${ String( seconds ).padStart(
			2,
			'0'
		) }`;
	}

	return `${ minutes }:${ String( seconds ).padStart( 2, '0' ) }`;
}

/**
 * Map a raw /wp/v2/media item to the slice the preview renders.
 *
 * @param {ApiMediaItem} raw - The raw media item from the REST API response.
 * @return {PreviewVideo} The preview slice.
 */
function toPreviewVideo( raw: ApiMediaItem ): PreviewVideo {
	return {
		id: raw.id,
		title: raw.title?.rendered ?? raw.slug ?? '',
		poster: raw.media_details?.videopress?.poster ?? '',
		durationMs: raw.media_details?.videopress?.duration ?? 0,
	};
}

/**
 * VideoPress playlist block Edit component.
 *
 * Renders a static, ordered preview of the selected playlist (no live player
 * in v1): membership comes from /wp/v2/media filtered by the taxonomy, the
 * stored order is applied by the shared orderPlaylistVideos() helper — the
 * same reconciliation the server render performs — and the header mirrors the
 * frontend's artwork-with-first-poster-fallback rule. Both REST routes sit
 * behind `upload_files`, so users who cannot reach them (Contributors) get a
 * documented permission-error state instead of a broken picker.
 *
 * @param {PlaylistEditProps} props               - Component props.
 * @param {object}            props.attributes    - Block attributes.
 * @param {Function}          props.setAttributes - Function to set block attributes.
 * @return {ReactNode} The edit component.
 */
export default function PlaylistEdit( {
	attributes,
	setAttributes,
}: PlaylistEditProps ): ReactNode {
	const { playlistId, layout = 'list', showHeader = true, autoplayNext = true } = attributes;

	const blockProps = useBlockProps( {
		className: clsx(
			'wp-block-videopress-playlist',
			`wp-block-videopress-playlist--${ layout === 'grid' ? 'grid' : 'list' }`
		),
	} );

	// The site's playlists, for the picker and the selected term's name/order/artwork.
	const [ playlists, setPlaylists ] = useState< Playlist[] | null >( null );
	const [ playlistsError, setPlaylistsError ] = useState< PlaylistsError | null >( null );

	useEffect( () => {
		let isCancelled = false;

		apiFetch< ApiPlaylistTerm[] >( {
			// The dashboard's own playlists query (use-playlists.ts): the API
			// caps per_page at 100, and hide_empty is explicit so playlists
			// without videos still show up in the picker.
			path: addQueryArgs( '/wp/v2/videopress-playlists', { per_page: 100, hide_empty: false } ),
		} )
			.then( raw => {
				if ( ! isCancelled ) {
					setPlaylists( raw.map( toPlaylist ) );
				}
			} )
			.catch( ( error: { code?: string; data?: { status?: number } } ) => {
				if ( isCancelled ) {
					return;
				}
				const status = error?.data?.status;
				setPlaylistsError(
					status === 401 || status === 403 || error?.code === 'rest_forbidden'
						? 'forbidden'
						: 'error'
				);
			} );

		return () => {
			isCancelled = true;
		};
	}, [] );

	const playlist = useMemo(
		() => playlists?.find( item => item.id === playlistId ),
		[ playlists, playlistId ]
	);

	// The selected playlist's member videos, ordered like the frontend render.
	const [ videos, setVideos ] = useState< PreviewVideo[] | null >( null );
	const [ videosError, setVideosError ] = useState( false );

	useEffect( () => {
		if ( ! playlistId ) {
			setVideos( null );
			setVideosError( false );
			return;
		}

		let isCancelled = false;
		setVideos( null );
		setVideosError( false );

		apiFetch< ApiMediaItem[] >( {
			// The dashboard's member fetch (use-playlist-videos.ts): explicit
			// date ordering so orderPlaylistVideos() appends order-less members
			// deterministically (newest first), matching the server render.
			path: addQueryArgs( '/wp/v2/media', {
				'videopress-playlists': playlistId,
				per_page: 100,
				orderby: 'date',
				order: 'desc',
			} ),
		} )
			.then( raw => {
				if ( ! isCancelled ) {
					setVideos( raw.map( toPreviewVideo ) );
				}
			} )
			.catch( () => {
				if ( ! isCancelled ) {
					setVideosError( true );
				}
			} );

		return () => {
			isCancelled = true;
		};
	}, [ playlistId ] );

	const order = playlist?.order;
	const orderedVideos = useMemo(
		() => orderPlaylistVideos( videos ?? [], order ?? [] ),
		[ videos, order ]
	);

	// Resolve the artwork attachment to a URL; on failure (deleted artwork)
	// the header falls back to the first video's poster, like the frontend.
	const artworkId = playlist?.artworkId ?? null;
	const [ artworkUrl, setArtworkUrl ] = useState( '' );

	useEffect( () => {
		if ( ! artworkId ) {
			setArtworkUrl( '' );
			return;
		}

		let isCancelled = false;
		setArtworkUrl( '' );

		apiFetch< {
			source_url?: string;
			media_details?: { sizes?: Record< string, { source_url?: string } > };
		} >( { path: `/wp/v2/media/${ artworkId }` } )
			.then( media => {
				if ( ! isCancelled ) {
					setArtworkUrl( media.media_details?.sizes?.medium?.source_url ?? media.source_url ?? '' );
				}
			} )
			.catch( () => {
				if ( ! isCancelled ) {
					setArtworkUrl( '' );
				}
			} );

		return () => {
			isCancelled = true;
		};
	}, [ artworkId ] );

	const renderPlaceholder = ( children: ReactNode, instructions?: string ) => (
		<Placeholder
			icon={ <BlockIcon icon={ VideoPressIcon } /> }
			label={ BLOCK_LABEL }
			instructions={ instructions }
			className="is-videopress-playlist-placeholder"
		>
			{ children }
		</Placeholder>
	);

	const renderHeader = ( selectedPlaylist: Playlist ) => {
		const headerArtworkUrl = artworkUrl !== '' ? artworkUrl : orderedVideos[ 0 ]?.poster ?? '';

		return (
			<div className="wp-block-videopress-playlist__header">
				{ headerArtworkUrl !== '' && (
					<img className="wp-block-videopress-playlist__artwork" src={ headerArtworkUrl } alt="" />
				) }
				<div className="wp-block-videopress-playlist__header-text">
					<span className="wp-block-videopress-playlist__name">{ selectedPlaylist.name }</span>
					{ selectedPlaylist.description !== '' && (
						<div className="wp-block-videopress-playlist__description">
							{ selectedPlaylist.description }
						</div>
					) }
					<span className="wp-block-videopress-playlist__count">
						{ sprintf(
							/* translators: %d: the number of videos in the playlist. */
							_n( '%d video', '%d videos', orderedVideos.length, 'jetpack-videopress-pkg' ),
							orderedVideos.length
						) }
					</span>
				</div>
			</div>
		);
	};

	const renderPreview = ( selectedPlaylist: Playlist ) => {
		const firstVideo = orderedVideos[ 0 ];

		return (
			<>
				{ showHeader && renderHeader( selectedPlaylist ) }
				<div className="wp-block-videopress-playlist__player wp-block-videopress-playlist__player--preview">
					{ firstVideo.poster !== '' ? (
						<img
							className="wp-block-videopress-playlist__player-poster"
							src={ firstVideo.poster }
							alt={ firstVideo.title }
						/>
					) : (
						<span className="wp-block-videopress-playlist__player-poster wp-block-videopress-playlist__player-poster--empty" />
					) }
				</div>
				<ol className="wp-block-videopress-playlist__items">
					{ orderedVideos.map( ( video, index ) => (
						<li key={ video.id } className="wp-block-videopress-playlist__item">
							<div
								className="wp-block-videopress-playlist__item-button"
								aria-current={ index === 0 ? 'true' : undefined }
							>
								<span className="wp-block-videopress-playlist__item-index">{ index + 1 }</span>
								{ video.poster !== '' ? (
									<img
										className="wp-block-videopress-playlist__item-poster"
										src={ video.poster }
										alt=""
										loading="lazy"
									/>
								) : (
									<span className="wp-block-videopress-playlist__item-poster wp-block-videopress-playlist__item-poster--empty" />
								) }
								<span className="wp-block-videopress-playlist__item-title">{ video.title }</span>
								{ video.durationMs > 0 && (
									<span className="wp-block-videopress-playlist__item-duration">
										{ formatDuration( video.durationMs ) }
									</span>
								) }
							</div>
						</li>
					) ) }
				</ol>
			</>
		);
	};

	let body: ReactNode;

	if ( playlistsError === 'forbidden' ) {
		body = renderPlaceholder(
			<span className="wp-block-videopress-playlist__message">
				{ __(
					'You do not have permission to browse the playlists on this site. Ask an editor or administrator to insert the playlist for you.',
					'jetpack-videopress-pkg'
				) }
			</span>
		);
	} else if ( playlistsError === 'error' ) {
		body = renderPlaceholder(
			<span className="wp-block-videopress-playlist__message">
				{ __(
					'The playlists could not be loaded. Reload the editor to try again.',
					'jetpack-videopress-pkg'
				) }
			</span>
		);
	} else if ( playlists === null ) {
		body = renderPlaceholder(
			<div className="loading-wrapper">
				<Spinner />
				{ __( 'Loading playlists…', 'jetpack-videopress-pkg' ) }
			</div>
		);
	} else if ( ! playlist ) {
		// Nothing selected yet, or the selected playlist was deleted.
		body = renderPlaceholder(
			<div className="wp-block-videopress-playlist__picker">
				{ playlistId ? (
					<span className="wp-block-videopress-playlist__message">
						{ __(
							'The selected playlist no longer exists. Pick another one.',
							'jetpack-videopress-pkg'
						) }
					</span>
				) : null }
				{ playlists.length > 0 ? (
					<PlaylistPicker
						playlists={ playlists }
						value={ playlistId }
						onChange={ next => setAttributes( { playlistId: next } ) }
					/>
				) : (
					<span className="wp-block-videopress-playlist__message">
						{ __(
							'No playlists found. Create one from the VideoPress dashboard first.',
							'jetpack-videopress-pkg'
						) }
					</span>
				) }
			</div>,
			playlistId
				? undefined
				: __( 'Pick a playlist to embed on this page.', 'jetpack-videopress-pkg' )
		);
	} else if ( videosError ) {
		body = renderPlaceholder(
			<span className="wp-block-videopress-playlist__message">
				{ __(
					'The playlist videos could not be loaded. Reload the editor to try again.',
					'jetpack-videopress-pkg'
				) }
			</span>
		);
	} else if ( videos === null ) {
		body = renderPlaceholder(
			<div className="loading-wrapper">
				<Spinner />
				{ __( 'Loading playlist videos…', 'jetpack-videopress-pkg' ) }
			</div>
		);
	} else if ( orderedVideos.length === 0 ) {
		body = renderPlaceholder(
			<span className="wp-block-videopress-playlist__message">
				{ __(
					'This playlist has no videos yet, so nothing will show on the page. Add videos to it from the VideoPress dashboard.',
					'jetpack-videopress-pkg'
				) }
			</span>
		);
	} else {
		body = renderPreview( playlist );
	}

	return (
		<figure { ...blockProps }>
			<InspectorControls>
				<PanelBody title={ __( 'Playlist settings', 'jetpack-videopress-pkg' ) }>
					{ playlists !== null && playlists.length > 0 && (
						<PlaylistPicker
							playlists={ playlists }
							value={ playlistId }
							onChange={ next => setAttributes( { playlistId: next } ) }
						/>
					) }
					<SelectControl
						label={ __( 'Layout', 'jetpack-videopress-pkg' ) }
						value={ layout === 'grid' ? 'grid' : 'list' }
						options={ [
							{ label: __( 'List', 'jetpack-videopress-pkg' ), value: 'list' },
							{ label: __( 'Grid', 'jetpack-videopress-pkg' ), value: 'grid' },
						] }
						onChange={ next => setAttributes( { layout: next === 'grid' ? 'grid' : 'list' } ) }
						__nextHasNoMarginBottom
						__next40pxDefaultSize
					/>
					<ToggleControl
						label={ __( 'Show playlist header', 'jetpack-videopress-pkg' ) }
						checked={ showHeader }
						onChange={ next => setAttributes( { showHeader: next } ) }
						help={ __(
							'Display the playlist artwork, name, and description above the player.',
							'jetpack-videopress-pkg'
						) }
						__nextHasNoMarginBottom={ true }
					/>
					<ToggleControl
						label={ __( 'Autoplay next video', 'jetpack-videopress-pkg' ) }
						checked={ autoplayNext }
						onChange={ next => setAttributes( { autoplayNext: next } ) }
						help={ __(
							'Continue with the next video when the current one ends.',
							'jetpack-videopress-pkg'
						) }
						__nextHasNoMarginBottom={ true }
					/>
				</PanelBody>
			</InspectorControls>
			{ body }
		</figure>
	);
}
