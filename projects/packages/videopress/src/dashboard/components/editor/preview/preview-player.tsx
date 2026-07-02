/**
 * Preview player for the Studio TRIM & CUT editor.
 *
 * Renders a plain <video> on the attachment's `sourceUrl` (signed with a
 * `metadata_token` playback JWT for private videos) plus a transport row:
 * play/pause, an editable current timecode, the total duration, and the
 * "Preview cuts" toggle. Playback state lives in `usePreviewPlayback`, which
 * runs the edit session's skip engine while playing.
 *
 * MASTER ASSUMPTION (v1): this player treats `sourceUrl` as the ORIGINAL
 * master file, which is true today because no edit pipeline exists — every
 * attachment's source_url points at the untouched upload. Once server-side
 * edit revisions land, source_url may start serving the newest edited output,
 * so the edits REST contract will need to expose an explicit master playback
 * URL for the editor. Deliberately not solved here.
 */
import { Button, Spinner, ToggleControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Stack, Text } from '@wordpress/ui';
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { usePlaybackToken } from '../../../hooks/use-poster-url';
import { formatTimecode } from '../state/time-utils';
import { parseTimecode } from './parse-timecode';
import { usePreviewPlayback } from './use-preview-playback';
import './style.scss';
import type { LibraryItem } from '../../../types/library';
import type { EditSession } from '../state/edit-session';
import type { ReactElement } from 'react';

const playIcon = (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 24 24"
		width="24"
		height="24"
		aria-hidden="true"
		focusable="false"
	>
		<path d="M8 5v14l11-7z" fill="currentColor" />
	</svg>
);

const pauseIcon = (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 24 24"
		width="24"
		height="24"
		aria-hidden="true"
		focusable="false"
	>
		<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" fill="currentColor" />
	</svg>
);

type TimecodeFieldProps = {
	valueMs: number;
	onCommit: ( ms: number ) => void;
};

/**
 * Editable current-time field. Shows the live timecode while idle; typing
 * starts a draft that commits on Enter or blur (when it parses) and reverts
 * on Escape.
 *
 * @param props          - Component props.
 * @param props.valueMs  - Live playhead position in ms.
 * @param props.onCommit - Called with the parsed position in ms.
 * @return The input element.
 */
function StudioEditorTimecodeField( { valueMs, onCommit }: TimecodeFieldProps ): ReactElement {
	const [ draft, setDraft ] = useState< string | null >( null );
	// Enter/Escape blur the field after already handling the draft; this flag
	// stops the blur handler from committing a second time (or committing a
	// draft Escape just discarded — state updates haven't flushed yet).
	const skipBlurCommitRef = useRef( false );

	const commit = () => {
		if ( draft !== null ) {
			const parsed = parseTimecode( draft );
			if ( parsed !== null ) {
				onCommit( parsed );
			}
		}
		setDraft( null );
	};

	return (
		<input
			className="vp-studio-editor-preview__timecode"
			type="text"
			aria-label={ __( 'Current time', 'jetpack-videopress-pkg' ) }
			value={ draft ?? formatTimecode( valueMs ) }
			onChange={ event => setDraft( event.target.value ) }
			onBlur={ () => {
				if ( skipBlurCommitRef.current ) {
					skipBlurCommitRef.current = false;
					return;
				}
				commit();
			} }
			onKeyDown={ event => {
				if ( event.key === 'Enter' ) {
					commit();
					skipBlurCommitRef.current = true;
					event.currentTarget.blur();
				} else if ( event.key === 'Escape' ) {
					setDraft( null );
					skipBlurCommitRef.current = true;
					event.currentTarget.blur();
				}
			} }
		/>
	);
}

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
}

type Props = {
	/** The video being edited (guid, sourceUrl, privacy, duration). */
	video: LibraryItem;
	/** The edit session driving the skip engine. */
	session: EditSession;
	/** Whether cut skipping is active during playback. */
	previewCutsEnabled: boolean;
	/** Called when the user toggles "Preview cuts". */
	onPreviewCutsChange: ( enabled: boolean ) => void;
	/** Playhead position in master-timeline ms, once per change. */
	onTimeUpdate?: ( currentMs: number ) => void;
	/** Master duration in ms, reported when known (metadata or fallback). */
	onDurationChange?: ( durationMs: number ) => void;
};

/**
 * The Studio editor's preview player: <video> stage + transport row.
 *
 * @param props - Component props (see {@link Props}).
 * @param ref   - Imperative handle with seekTo/play/pause.
 * @return The preview-player element.
 */
const StudioEditorPreviewPlayer = forwardRef< StudioEditorPreviewPlayerHandle, Props >(
	function StudioEditorPreviewPlayerInner(
		{ video, session, previewCutsEnabled, onPreviewCutsChange, onTimeUpdate, onDurationChange },
		ref
	): ReactElement {
		const { sourceUrl, isPrivate, guid, durationSeconds } = video;
		const token = usePlaybackToken( guid, isPrivate );
		const { currentMs, playing, durationMs, attachVideo, play, pause, togglePlay, seekTo } =
			usePreviewPlayback( {
				session,
				previewCutsEnabled,
				fallbackDurationMs: durationSeconds * 1000,
			} );

		useImperativeHandle( ref, () => ( { seekTo, play, pause, togglePlay } ), [
			seekTo,
			play,
			pause,
			togglePlay,
		] );

		useEffect( () => {
			onTimeUpdate?.( currentMs );
		}, [ currentMs, onTimeUpdate ] );

		useEffect( () => {
			if ( durationMs > 0 ) {
				onDurationChange?.( durationMs );
			}
		}, [ durationMs, onDurationChange ] );

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
				</div>
				<div className="vp-studio-editor-preview__transport">
					<Stack direction="row" gap="sm" align="center">
						<Button
							size="compact"
							icon={ playing ? pauseIcon : playIcon }
							label={
								playing
									? __( 'Pause', 'jetpack-videopress-pkg' )
									: __( 'Play', 'jetpack-videopress-pkg' )
							}
							onClick={ togglePlay }
						/>
						<StudioEditorTimecodeField valueMs={ currentMs } onCommit={ seekTo } />
						<Text className="vp-studio-editor-preview__duration">
							{ `/ ${ formatTimecode( durationMs ) }` }
						</Text>
						<ToggleControl
							__nextHasNoMarginBottom
							className="vp-studio-editor-preview__preview-cuts"
							label={ __( 'Preview cuts', 'jetpack-videopress-pkg' ) }
							checked={ previewCutsEnabled }
							onChange={ onPreviewCutsChange }
						/>
					</Stack>
				</div>
			</div>
		);
	}
);

export default StudioEditorPreviewPlayer;
