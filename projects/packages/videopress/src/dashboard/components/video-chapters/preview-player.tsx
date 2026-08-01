/**
 * Preview player for the Chapters tab.
 *
 * Renders a plain <video> stage on the attachment's best playable URL
 * (signed with a `metadata_token` playback JWT for private videos). The
 * transport controls live in the chapters timeline toolbar; this component
 * owns only the stage and reports playback state upward
 * (onTimeUpdate/onDurationChange/onPlayingChange) while exposing an
 * imperative handle for the timeline to drive. Playback state lives in
 * `usePreviewPlayback` (identity playback — the video plays as-is).
 */
import { Spinner } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Text } from '@wordpress/ui';
import { forwardRef, useEffect, useImperativeHandle } from 'react';
import { usePlaybackToken } from '../../hooks/use-poster-url';
import { usePreviewPlayback } from './use-preview-playback';
import './preview-player.scss';
import type { LibraryItem } from '../../types/library';
import type { ReactElement } from 'react';

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
	video: LibraryItem;
	/** Playhead position in ms, once per change. */
	onTimeUpdate?: ( currentMs: number ) => void;
	/** Media duration in ms, reported when known (metadata or fallback). */
	onDurationChange?: ( durationMs: number ) => void;
	/**
	 * Whether playback is running, once per change. The stage mirrors
	 * this into state for the timeline toolbar's transport button.
	 */
	onPlayingChange?: ( playing: boolean ) => void;
};

/**
 * The Chapters tab's preview player: a bare <video> stage.
 *
 * @param props - Component props (see {@link Props}).
 * @param ref   - Imperative handle with seekTo/play/pause.
 * @return The preview-player element.
 */
const ChaptersPreviewPlayer = forwardRef< ChaptersPreviewPlayerHandle, Props >(
	function ChaptersPreviewPlayerInner(
		{ video, onTimeUpdate, onDurationChange, onPlayingChange },
		ref
	): ReactElement {
		// Prefer the transcoded H.264 rendition: the original upload may be an
		// HEVC .mov the browser can't decode (playbackUrl falls back upstream).
		const { isPrivate, guid, durationSeconds } = video;
		const sourceUrl = video.playbackUrl ?? video.sourceUrl;
		const token = usePlaybackToken( guid, isPrivate );
		const {
			currentMs,
			playing,
			durationMs,
			attachVideo,
			play,
			pause,
			togglePlay,
			seekTo,
			playbackError,
		} = usePreviewPlayback( {
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
			if ( durationMs > 0 ) {
				onDurationChange?.( durationMs );
			}
		}, [ durationMs, onDurationChange ] );

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
							preload="metadata"
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
