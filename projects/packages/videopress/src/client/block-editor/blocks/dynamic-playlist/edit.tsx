/**
 * WordPress dependencies
 */
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import { PanelBody, Placeholder, RangeControl, Spinner } from '@wordpress/components';
import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { PlaylistSettingsPanels, PlaylistStylesControls } from '../playlist/inspector-controls';
import PlaylistPreview from '../playlist/preview';
import usePlaylistLiveMetadata from '../playlist/use-live-metadata';
import usePublishTracking from '../playlist/use-publish-tracking';
import { playlistFontVariables, playlistWrapperClasses } from '../playlist/utils';
import { VideoPressIcon } from '../video/components/icons';
import {
	clampVideoCount,
	fetchLatestVideos,
	MAX_VIDEO_COUNT,
	MIN_VIDEO_COUNT,
} from './fetch-latest-videos';
/**
 * Types
 */
import type { DynamicPlaylistAttributes } from './types';
import type { PlaylistEntry } from '../playlist/types';
import type { BlockEditProps } from '@wordpress/blocks';

type LoadStatus = 'loading' | 'ready' | 'error';

/**
 * Dynamic Video Playlist block edit component.
 *
 * The canvas previews the site's newest VideoPress videos exactly as the
 * front end renders them; the sidebar sets how many to show plus the same
 * playback and display options as the Video Playlist block.
 *
 * @param props               - Block edit props.
 * @param props.attributes    - Block attributes.
 * @param props.setAttributes - Attribute setter.
 * @param props.clientId      - This block instance's client id.
 * @return Edit component.
 */
export default function DynamicPlaylistEdit( {
	attributes,
	setAttributes,
	clientId,
}: BlockEditProps< DynamicPlaylistAttributes > ) {
	const { count, layout, entryTitleFontFamily } = attributes;

	const [ videos, setVideos ] = useState< PlaylistEntry[] >( [] );
	const [ status, setStatus ] = useState< LoadStatus >( 'loading' );
	const [ previewIndex, setPreviewIndex ] = useState( 0 );

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

	const { liveMetadata } = usePlaylistLiveMetadata( videos );

	// Records a Tracks event when a post/page is published with the playlist.
	usePublishTracking( {
		clientId,
		layout,
		videoCount: videos.length,
		blockName: 'videopress/dynamic-playlist',
		eventName: 'jetpack_videopress_dynamic_playlist_block_published',
	} );

	const currentIndex = Math.min( previewIndex, Math.max( 0, videos.length - 1 ) );

	const blockProps = useBlockProps( {
		className: videos.length
			? playlistWrapperClasses( attributes )
			: 'videopress-playlist is-empty',
		style: playlistFontVariables( entryTitleFontFamily ),
	} );

	const inspectorControls = (
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
	);

	const stylesControls = (
		<PlaylistStylesControls attributes={ attributes } setAttributes={ setAttributes } />
	);

	if ( status !== 'ready' || ! videos.length ) {
		// Kept as separate statements so the minifier can't merge the __() calls.
		const loadingLabel = __( 'Loading your latest videos…', 'jetpack-videopress-pkg' );
		const errorLabel = __( 'Your latest videos could not be loaded', 'jetpack-videopress-pkg' );
		const emptyLabel = __( 'No VideoPress videos yet', 'jetpack-videopress-pkg' );

		let label: string = emptyLabel;
		if ( status === 'loading' ) {
			label = loadingLabel;
		} else if ( status === 'error' ) {
			label = errorLabel;
		}

		let instructions: string | undefined;
		if ( status === 'error' ) {
			instructions = __( 'Reload the editor to try again.', 'jetpack-videopress-pkg' );
		} else if ( status === 'ready' ) {
			instructions = __(
				'Upload a video to VideoPress and it will show up here.',
				'jetpack-videopress-pkg'
			);
		}

		return (
			<div { ...blockProps }>
				{ inspectorControls }
				{ stylesControls }
				<Placeholder icon={ VideoPressIcon } label={ label } instructions={ instructions }>
					{ status === 'loading' && <Spinner /> }
				</Placeholder>
			</div>
		);
	}

	return (
		<figure { ...blockProps }>
			{ inspectorControls }
			{ stylesControls }
			<PlaylistPreview
				videos={ videos }
				attributes={ attributes }
				currentIndex={ currentIndex }
				liveMetadata={ liveMetadata }
				onSelect={ setPreviewIndex }
			/>
		</figure>
	);
}
