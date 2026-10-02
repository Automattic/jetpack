/**
 * WordPress dependencies
 */
import {
	BlockContextProvider,
	InspectorControls,
	useBlockProps,
	useInnerBlocksProps,
} from '@wordpress/block-editor';
import { PanelBody, RangeControl } from '@wordpress/components';
import { useEffect, useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { PlaylistSettingsPanels, PlaylistStylesControls } from '../playlist/inspector-controls';
import usePublishTracking from '../playlist/use-publish-tracking';
import { LATEST_VIDEOS_PLAYLIST_CONTEXT } from './context';
import {
	clampVideoCount,
	fetchLatestVideos,
	MAX_VIDEO_COUNT,
	MIN_VIDEO_COUNT,
} from './fetch-latest-videos';
/**
 * Types
 */
import type { LatestVideosPlaylistContext, LatestVideosStatus } from './context';
import type { LatestVideosPlaylistAttributes } from './types';
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
	const { count, layout } = attributes;

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

	const innerBlocksProps = useInnerBlocksProps(
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
						label={ __( 'Number of videos', 'jetpack-videopress-pkg' ) }
						min={ MIN_VIDEO_COUNT }
						max={ MAX_VIDEO_COUNT }
						value={ clampVideoCount( count ) }
						onChange={ ( value?: number ) => setAttributes( { count: clampVideoCount( value ) } ) }
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
				<div { ...innerBlocksProps } />
			</BlockContextProvider>
		</>
	);
}
