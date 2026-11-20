import { __ } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';
import { useEffect, useRef, useState } from 'react';
import getMediaToken from '../../../client/lib/get-media-token';
import './preview-player.scss';
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
 * exactly as they do for site visitors. Videos still being transcoded render
 * the embed too: the player's own converting screen reports the live
 * processing percentage and starts playback when it completes. Private
 * videos get a playback token minted before the embed loads; local items
 * without a VideoPress GUID fall back to a native `<video>` on their direct
 * source.
 *
 * @param props       - Component props.
 * @param props.video - The current video record.
 * @return The player element, or null when there is nothing playable yet.
 */
export default function PreviewPlayer( { video }: Props ): ReactElement | null {
	const { guid, isPrivate, conversionFailed } = video;
	// null = token fetch pending, '' = failed or not needed, string = minted token.
	const [ playbackToken, setPlaybackToken ] = useState< string | null >( null );
	const previousVideo = useRef( video );
	const [ embedRevision, setEmbedRevision ] = useState( 0 );

	useEffect( () => {
		const previous = previousVideo.current;
		// Refresh saved title/poster edits without reloading when processing supplies the first poster.
		if (
			previous.guid === video.guid &&
			! previous.isProcessing &&
			! video.isProcessing &&
			( previous.title !== video.title || previous.thumbnailUrl !== video.thumbnailUrl )
		) {
			setEmbedRevision( revision => revision + 1 );
		}
		previousVideo.current = video;
	}, [ video.guid, video.title, video.thumbnailUrl, video.isProcessing ] );

	/*
	 * Private videos require a playback token on the embed URL. Mint one when
	 * needed; if minting fails, fall back to the tokenless embed.
	 */
	useEffect( () => {
		if ( ! isPrivate || ! guid || conversionFailed ) {
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
	}, [ guid, isPrivate, conversionFailed ] );

	if ( conversionFailed ) {
		return (
			<div className="vp-preview-player">
				<p className="vp-preview-player__status" role="status">
					{ __(
						'Conversion failed. Delete this video and upload it again.',
						'jetpack-videopress-pkg'
					) }
				</p>
			</div>
		);
	}

	if ( ! guid ) {
		if ( ! video.sourceUrl ) {
			return null;
		}
		return (
			<div className="vp-preview-player">
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
		return <div className="vp-preview-player" aria-busy="true" />;
	}

	return (
		<div className="vp-preview-player">
			<iframe
				key={ embedRevision }
				title={ __( 'Video preview', 'jetpack-videopress-pkg' ) }
				src={ getVideoPressEmbedUrl( guid, isPrivate, playbackToken || undefined ) }
				allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
				allowFullScreen
			/>
		</div>
	);
}
