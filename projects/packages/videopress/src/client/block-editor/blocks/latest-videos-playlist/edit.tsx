/**
 * WordPress dependencies
 */
import {
	BlockContextProvider,
	InspectorControls,
	useBlockProps,
	useInnerBlocksProps,
} from '@wordpress/block-editor';
import { PanelBody, RangeControl, SelectControl, ToggleControl } from '@wordpress/components';
import { useEffect, useMemo, useState } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { EmptyStateControl } from '../../channel/editor-controls';
import ServerPreview from '../../channel/server-preview';
import { PlaylistSettingsPanels, PlaylistStylesControls } from '../playlist/inspector-controls';
import usePublishTracking from '../playlist/use-publish-tracking';
import { LATEST_VIDEOS_PLAYLIST_CONTEXT } from './context';
import {
	clampVideoCount,
	fetchLatestVideos,
	MAX_PAGED_VIDEO_COUNT,
	MAX_VIDEO_COUNT,
	MIN_VIDEO_COUNT,
} from './fetch-latest-videos';
/**
 * Types
 */
import type { LatestVideosPlaylistContext, LatestVideosStatus } from './context';
import type { LatestVideosOrder, LatestVideosPlaylistAttributes } from './types';
import type { PlaylistEntry } from '../playlist/types';
import type { BlockEditProps } from '@wordpress/blocks';

// The canvas is one locked Video Playlist block, rendered from this block's context.
const TEMPLATE: Array< [ string ] > = [ [ 'videopress/playlist' ] ];

/**
 * Latest Videos Playlist block edit component.
 *
 * The block owns the settings: how many videos to show plus the same
 * playback and display options as the Video Playlist block. Its canvas is a
 * Video Playlist inner block that renders whatever this block hands it
 * through block context, so nothing about the videos is stored in the post.
 *
 * @param props               - Block edit props.
 * @param props.attributes    - Block attributes.
 * @param props.setAttributes - Attribute setter.
 * @param props.clientId      - This block instance's client id.
 * @return Edit component.
 */
export default function LatestVideosPlaylistEdit( {
	attributes,
	setAttributes,
	clientId,
}: BlockEditProps< LatestVideosPlaylistAttributes > ) {
	const { count, layout, orderBy, showBrowseControls, pagination, excludeCurrent, showMeta } =
		attributes;
	const maxCount = 'numbered' === pagination ? MAX_PAGED_VIDEO_COUNT : MAX_VIDEO_COUNT;
	// The canvas only knows the newest videos; anything else previews the site's own render.
	const isServerPreview =
		( !! orderBy && 'newest' !== orderBy ) ||
		!! showBrowseControls ||
		'numbered' === pagination ||
		!! excludeCurrent ||
		!! showMeta;

	const [ videos, setVideos ] = useState< PlaylistEntry[] >( [] );
	const [ status, setStatus ] = useState< LatestVideosStatus >( 'loading' );

	useEffect( () => {
		let cancelled = false;
		setStatus( 'loading' );

		fetchLatestVideos( count )
			.then( entries => {
				if ( ! cancelled ) {
					setVideos( entries );
					setStatus( 'ready' );
				}
			} )
			.catch( () => {
				if ( ! cancelled ) {
					setStatus( 'error' );
				}
			} );

		return () => {
			cancelled = true;
		};
	}, [ count ] );

	// Records a Tracks event when a post/page is published with the playlist.
	usePublishTracking( {
		clientId,
		layout,
		videoCount: videos.length,
		blockName: 'videopress/latest-videos-playlist',
		eventName: 'jetpack_videopress_latest_videos_playlist_block_published',
	} );

	const context = useMemo< Record< string, LatestVideosPlaylistContext > >(
		() => ( { [ LATEST_VIDEOS_PLAYLIST_CONTEXT ]: { videos, status, attributes } } ),
		[ videos, status, attributes ]
	);

	const { children: innerBlocks, ...wrapperProps } = useInnerBlocksProps(
		useBlockProps( { className: 'videopress-latest-videos-playlist' } ),
		{ template: TEMPLATE, templateLock: 'all', renderAppender: false }
	);

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Videos', 'jetpack-videopress-pkg' ) }>
					<RangeControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={
							'numbered' === pagination
								? __( 'Videos per page', 'jetpack-videopress-pkg' )
								: _x( 'Number of videos', '', 'jetpack-videopress-pkg' )
						}
						min={ MIN_VIDEO_COUNT }
						max={ maxCount }
						value={ clampVideoCount( count, maxCount ) }
						onChange={ ( value?: number ) =>
							setAttributes( { count: clampVideoCount( value, maxCount ) } )
						}
					/>
					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Order', 'jetpack-videopress-pkg' ) }
						value={ orderBy ?? 'newest' }
						options={ [
							{ value: 'newest', label: __( 'Newest first', 'jetpack-videopress-pkg' ) },
							{ value: 'popular', label: __( 'Most viewed first', 'jetpack-videopress-pkg' ) },
							{ value: 'oldest', label: __( 'Oldest first', 'jetpack-videopress-pkg' ) },
						] }
						onChange={ value => setAttributes( { orderBy: value as LatestVideosOrder } ) }
					/>
					<ToggleControl
						__nextHasNoMarginBottom
						label={ __( 'Search, sort and length filters', 'jetpack-videopress-pkg' ) }
						checked={ !! showBrowseControls }
						onChange={ ( value: boolean ) => setAttributes( { showBrowseControls: value } ) }
					/>
					<ToggleControl
						__nextHasNoMarginBottom
						label={ __( 'Numbered pages', 'jetpack-videopress-pkg' ) }
						checked={ 'numbered' === pagination }
						onChange={ ( value: boolean ) =>
							setAttributes( {
								pagination: value ? 'numbered' : 'none',
								count: clampVideoCount( count, value ? MAX_PAGED_VIDEO_COUNT : MAX_VIDEO_COUNT ),
							} )
						}
					/>
					<ToggleControl
						__nextHasNoMarginBottom
						label={ __( 'Views and upload date', 'jetpack-videopress-pkg' ) }
						checked={ !! showMeta }
						onChange={ ( value: boolean ) => setAttributes( { showMeta: value } ) }
					/>
					<EmptyStateControl
						kind="videos"
						value={ attributes.emptyState }
						onChange={ emptyState => setAttributes( { emptyState } ) }
					/>
					<ToggleControl
						__nextHasNoMarginBottom
						label={ __( 'Hide the video being viewed', 'jetpack-videopress-pkg' ) }
						help={ __(
							'For channel video pages, e.g. an “Up next” list.',
							'jetpack-videopress-pkg'
						) }
						checked={ !! excludeCurrent }
						onChange={ ( value: boolean ) => setAttributes( { excludeCurrent: value } ) }
					/>
					<p className="videopress-playlist-editor__help">
						{ __(
							'Shows the newest videos in your VideoPress library, newest first. New uploads appear here automatically.',
							'jetpack-videopress-pkg'
						) }
					</p>
				</PanelBody>

				<PlaylistSettingsPanels attributes={ attributes } setAttributes={ setAttributes } />
			</InspectorControls>
			<PlaylistStylesControls attributes={ attributes } setAttributes={ setAttributes } />

			<BlockContextProvider value={ context }>
				<div { ...wrapperProps }>
					{ isServerPreview && (
						<ServerPreview
							block="videopress/latest-videos-playlist"
							attributes={ attributes }
							label={ __( 'Latest Videos Playlist', 'jetpack-videopress-pkg' ) }
							emptyInstructions={ __(
								'Upload a VideoPress video to see it here.',
								'jetpack-videopress-pkg'
							) }
						/>
					) }
					{ /* The locked inner playlist stays in the tree so the saved markup keeps it. */ }
					<div hidden={ isServerPreview }>{ innerBlocks }</div>
				</div>
			</BlockContextProvider>
		</>
	);
}
