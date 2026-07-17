import { __ } from '@wordpress/i18n';
import { Text } from '@wordpress/ui';
import { addQueryArgs } from '@wordpress/url';
import { useEffect, useState } from 'react';
import getMediaToken from '../../../client/lib/get-media-token';
import type { LibraryItem } from '../../types/library';
import type { ReactElement } from 'react';

type Props = {
	video: LibraryItem;
};

/*
 * Private videos are embedded from video.wordpress.com; public ones from
 * videopress.com — same split the caption manager's preview player uses.
 */
const getVideoPressEmbedOrigin = ( isPrivate: boolean ): string =>
	isPrivate ? 'https://video.wordpress.com' : 'https://videopress.com';

/*
 * `resizeToParent` keeps the player sized to the iframe, which the stylesheet
 * pins to a 16:9 frame; non-16:9 videos letterbox inside it rather than crop
 * (the block's `cover` mode). Controls are on by default, matching the block.
 */
const getVideoPressEmbedUrl = ( guid: string, isPrivate: boolean, playbackToken?: string ) =>
	addQueryArgs( `${ getVideoPressEmbedOrigin( isPrivate ) }/embed/${ guid }`, {
		resizeToParent: true,
		...( playbackToken ? { metadata_token: playbackToken } : {} ),
	} );

/**
 * Playable preview at the top of the Video details screen. Embeds the same
 * VideoPress player the block renders in post content (an iframe from
 * videopress.com), so playback, captions, quality and fullscreen all behave
 * exactly as they do for site visitors. Private videos get a playback token
 * minted before the embed loads; local items without a VideoPress GUID fall
 * back to a native `<video>` on their direct source.
 *
 * @param props       - Component props.
 * @param props.video - The current video record.
 * @return The player element, or null when there is nothing playable yet.
 */
export default function PreviewPlayer( { video }: Props ): ReactElement | null {
	const { guid, isPrivate } = video;
	// null = token fetch pending, '' = failed or not needed, string = minted token.
	const [ playbackToken, setPlaybackToken ] = useState< string | null >( null );

	/*
	 * Private videos require a playback token on the embed URL. Mint one when
	 * needed; if minting fails, fall back to the tokenless embed.
	 */
	useEffect( () => {
		if ( ! isPrivate || ! guid ) {
			return;
		}

		let isCurrent = true;
		getMediaToken( 'playback', { guid } )
			.then( tokenData => {
				if ( isCurrent ) {
					setPlaybackToken( tokenData?.token || '' );
				}
			} )
			.catch( () => {
				if ( isCurrent ) {
					setPlaybackToken( '' );
				}
			} );

		return () => {
			isCurrent = false;
		};
	}, [ guid, isPrivate ] );

	if ( video.isProcessing ) {
		return (
			<div className="vp-video-details__player vp-video-details__player-processing">
				<Text>{ __( 'Processing', 'jetpack-videopress-pkg' ) }</Text>
			</div>
		);
	}

	if ( ! guid ) {
		if ( ! video.sourceUrl ) {
			return null;
		}
		return (
			<div className="vp-video-details__player">
				<video
					aria-label={ __( 'Video preview', 'jetpack-videopress-pkg' ) }
					src={ video.sourceUrl }
					poster={ video.thumbnailUrl ?? undefined }
					controls
				/>
			</div>
		);
	}

	// Hold the embed back until the playback-token fetch for a private video settles.
	if ( isPrivate && playbackToken === null ) {
		return <div className="vp-video-details__player" aria-busy="true" />;
	}

	return (
		<div className="vp-video-details__player">
			<iframe
				title={ __( 'Video preview', 'jetpack-videopress-pkg' ) }
				src={ getVideoPressEmbedUrl( guid, isPrivate, playbackToken || undefined ) }
				allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
				allowFullScreen
			/>
		</div>
	);
}
