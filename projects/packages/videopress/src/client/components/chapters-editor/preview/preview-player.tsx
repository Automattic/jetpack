/**
 * Preview player for the chapters editing surfaces: the dashboard's Editor
 * tab and the chapter manager modal.
 *
 * Renders a plain <video> stage on the video's best playable URL (signed
 * with a `metadata_token` playback JWT for private videos). The transport
 * controls live in the chapters timeline toolbar; this component owns only
 * the stage and reports playback state upward (onTimeUpdate/onPlayingChange)
 * while exposing an imperative handle for the timeline to drive. Playback
 * state lives in `usePreviewPlayback` (identity playback — the video plays
 * as-is).
 */
import { Spinner } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Text } from '@wordpress/ui';
import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import getMediaToken from '../../../lib/get-media-token';
import { usePreviewPlayback } from './use-preview-playback';
import './preview-player.scss';
import type { ReactElement } from 'react';

/**
 * The fields the player reads from a video. The dashboard's Editor tab
 * passes its full LibraryItem (structurally compatible); the chapter manager
 * modal assembles one from the v1.1 item it fetches on open.
 */
export type ChaptersPreviewVideo = {
	/** The VideoPress guid, which keys the playback JWT for private videos. */
	guid: string;
	/** Whether the video is private: stream URLs 403 without a playback JWT. */
	isPrivate: boolean;
	/** Duration in seconds, reported until the element's metadata loads. */
	durationSeconds: number;
	/** The best H.264 rendition URL, once the transcode ladder is ready. */
	playbackUrl?: string;
	/** The original upload URL — last resort; may not decode in the browser. */
	sourceUrl?: string;
};

/**
 * Imperative surface exposed via ref, for the timeline to drive the player.
 */
export interface ChaptersPreviewPlayerHandle {
	/** Seek to a position in ms. */
	seekTo: ( ms: number ) => void;
	/** Start playback. */
	play: () => void;
	/** Pause playback. */
	pause: () => void;
	/** Toggle between play and pause (timeline space-bar shortcut). */
	togglePlay: () => void;
	/** Whether playback is currently running (timeline scrub pause/resume). */
	isPlaying: () => boolean;
}

type Props = {
	/** The video being previewed (guid, playback URLs, privacy, duration). */
	video: ChaptersPreviewVideo;
	/**
	 * H.264 rendition URL used when the item itself carries no playbackUrl —
	 * on WordPress.com Simple the media response omits the rendition data,
	 * so the Editor tab derives one from the v1.1 item it fetches for the
	 * probe.
	 */
	fallbackPlaybackUrl?: string;
	/** Playhead position in ms, once per change. */
	onTimeUpdate?: ( currentMs: number ) => void;
	/**
	 * Whether playback is running, once per change. Hosts mirror this into
	 * state for the timeline toolbar's transport button.
	 */
	onPlayingChange?: ( playing: boolean ) => void;
};

/**
 * Mint a playback JWT for a private video's stream URLs.
 *
 * Equivalent of the dashboard's react-query-backed usePlaybackToken, without
 * the QueryClient requirement (this component also mounts in the block
 * editor): getMediaToken caches minted playback tokens in localStorage for
 * ~24h, so repeated mounts share one request.
 *
 * @param guid    - VideoPress GUID.
 * @param enabled - Skip the request when false (public videos).
 * @return The token, or null while loading / disabled / unmintable.
 */
function usePlaybackToken( guid: string, enabled: boolean ): string | null {
	const [ token, setToken ] = useState< string | null >( null );

	useEffect( () => {
		if ( ! enabled || ! guid ) {
			return;
		}
		let isCurrent = true;
		getMediaToken( 'playback', { guid } )
			.then( tokenData => {
				if ( isCurrent && tokenData?.token ) {
					setToken( tokenData.token );
				}
			} )
			.catch( () => {
				// A failed mint keeps the element held back — same outcome as
				// the request never resolving: no doomed unsigned request.
			} );
		return () => {
			isCurrent = false;
		};
	}, [ guid, enabled ] );

	return token;
}

/**
 * The chapters editors' preview player: a bare <video> stage.
 *
 * @param props - Component props (see {@link Props}).
 * @param ref   - Imperative handle with seekTo/play/pause.
 * @return The preview-player element.
 */
const ChaptersPreviewPlayer = forwardRef< ChaptersPreviewPlayerHandle, Props >(
	function ChaptersPreviewPlayerInner(
		{ video, fallbackPlaybackUrl, onTimeUpdate, onPlayingChange },
		ref
	): ReactElement {
		// Prefer the transcoded H.264 rendition: the original upload may be an
		// HEVC .mov the browser can't decode (playbackUrl falls back upstream).
		const { isPrivate, guid, durationSeconds } = video;
		const sourceUrl = video.playbackUrl ?? fallbackPlaybackUrl ?? video.sourceUrl;
		const token = usePlaybackToken( guid, isPrivate );
		const { currentMs, playing, attachVideo, play, pause, togglePlay, seekTo, playbackError } =
			usePreviewPlayback( {
				fallbackDurationMs: durationSeconds * 1000,
			} );

		useImperativeHandle(
			ref,
			() => ( { seekTo, play, pause, togglePlay, isPlaying: () => playing } ),
			[ seekTo, play, pause, togglePlay, playing ]
		);

		useEffect( () => {
			onTimeUpdate?.( currentMs );
		}, [ currentMs, onTimeUpdate ] );

		useEffect( () => {
			onPlayingChange?.( playing );
		}, [ playing, onPlayingChange ] );

		// Private videos 403 without a playback JWT, so hold the element back
		// until the token arrives rather than firing a doomed request.
		let src: string | null = null;
		if ( sourceUrl ) {
			if ( ! isPrivate ) {
				src = sourceUrl;
			} else if ( token ) {
				src = `${ sourceUrl }?metadata_token=${ token }`;
			}
		}

		return (
			<div className="vp-chapters-preview">
				<div className="vp-chapters-preview__stage">
					{ src ? (
						<video
							ref={ attachVideo }
							className="vp-chapters-preview__video"
							data-testid="chapters-preview-video"
							src={ src }
							// "auto": buffer ahead from mount so pressing play doesn't
							// start a cold fetch — the editor's whole purpose is
							// scrubbing around the file.
							preload="auto"
							playsInline
						/>
					) : (
						<div className="vp-chapters-preview__placeholder">
							{ sourceUrl ? (
								<Spinner />
							) : (
								<Text>
									{ __( 'This video has no playable source.', 'jetpack-videopress-pkg' ) }
								</Text>
							) }
						</div>
					) }
					{ playbackError && (
						<Text className="vp-chapters-preview__error" role="alert">
							{ playbackError }
						</Text>
					) }
				</div>
			</div>
		);
	}
);

export default ChaptersPreviewPlayer;
