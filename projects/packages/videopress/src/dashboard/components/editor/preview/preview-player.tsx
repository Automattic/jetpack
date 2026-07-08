/**
 * Preview player for the Studio TRIM & CUT editor.
 *
 * Renders a plain <video> stage on the attachment's `sourceUrl` (signed with
 * a `metadata_token` playback JWT for private videos). Per the editor
 * redesign the transport controls live in the timeline toolbar; this
 * component owns only the stage and reports playback state upward
 * (onTimeUpdate/onDurationChange/onPlayingChange) while exposing an
 * imperative handle for the timeline to drive. Playback state lives in
 * `usePreviewPlayback`, which always runs the edit session's skip engine
 * while playing (the preview shows the edited result).
 *
 * MASTER ASSUMPTION (v1): this player treats `sourceUrl` as the ORIGINAL
 * master file, which is true today because no edit pipeline exists — every
 * attachment's source_url points at the untouched upload. Once server-side
 * edit revisions land, source_url may start serving the newest edited output,
 * so the edits REST contract will need to expose an explicit master playback
 * URL for the editor. Deliberately not solved here.
 */
import { Spinner } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Text } from '@wordpress/ui';
import { forwardRef, useEffect, useImperativeHandle } from 'react';
import { usePlaybackToken } from '../../../hooks/use-poster-url';
import { usePreviewPlayback } from './use-preview-playback';
import './style.scss';
import type { LibraryItem } from '../../../types/library';
import type { EditSession } from '../state/edit-session';
import type { ReactElement } from 'react';

/**
 * Imperative surface exposed via ref, for the timeline to drive the player.
 */
export interface StudioEditorPreviewPlayerHandle {
	/** Seek to a master-timeline position in ms. */
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
	/** The video being edited (guid, sourceUrl, privacy, duration). */
	video: LibraryItem;
	/** The edit session driving the skip engine. */
	session: EditSession;
	/** Playhead position in master-timeline ms, once per change. */
	onTimeUpdate?: ( currentMs: number ) => void;
	/** Master duration in ms, reported when known (metadata or fallback). */
	onDurationChange?: ( durationMs: number ) => void;
	/**
	 * Whether playback is running, once per change. The editor screen mirrors
	 * this into state for the timeline toolbar's transport button.
	 */
	onPlayingChange?: ( playing: boolean ) => void;
};

/**
 * The Studio editor's preview player: a bare <video> stage.
 *
 * @param props - Component props (see {@link Props}).
 * @param ref   - Imperative handle with seekTo/play/pause.
 * @return The preview-player element.
 */
const StudioEditorPreviewPlayer = forwardRef< StudioEditorPreviewPlayerHandle, Props >(
	function StudioEditorPreviewPlayerInner(
		{ video, session, onTimeUpdate, onDurationChange, onPlayingChange },
		ref
	): ReactElement {
		// Prefer the transcoded H.264 rendition: the original upload may be an
		// HEVC .mov the browser can't decode (playbackUrl falls back upstream).
		const { isPrivate, guid, durationSeconds } = video;
		const sourceUrl = video.playbackUrl ?? video.sourceUrl;
		const token = usePlaybackToken( guid, isPrivate );
		// Playback always previews the edited result: the skip engine jumps
		// over cut ranges and honors the trim window, like YouTube's editor.
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
			session,
			previewCutsEnabled: true,
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
			<div className="vp-studio-editor-preview">
				<div className="vp-studio-editor-preview__stage">
					{ src ? (
						<video
							ref={ attachVideo }
							className="vp-studio-editor-preview__video"
							data-testid="studio-editor-preview-video"
							src={ src }
							preload="metadata"
							playsInline
						/>
					) : (
						<div className="vp-studio-editor-preview__placeholder">
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
						<Text className="vp-studio-editor-preview__error" role="alert">
							{ playbackError }
						</Text>
					) }
				</div>
			</div>
		);
	}
);

export default StudioEditorPreviewPlayer;
