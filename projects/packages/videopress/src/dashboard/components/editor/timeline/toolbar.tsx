/**
 * Toolbar row above the Studio editor timeline, per the editor redesign:
 * the relocated transport (play/pause icon button + editable timecode +
 * duration) and the "New cut" action on the left, the zoom control (Fit +
 * four-stop slider) on the right.
 */
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { formatTimecode } from '../state/time-utils';
import StudioEditorTimecodeBox from './timecode-box';
import StudioEditorZoomControl from './zoom-control';
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

type Props = {
	/** Whether preview playback is running (picks the pause icon). */
	playing: boolean;
	/** Toggle preview playback. */
	onTogglePlay: () => void;
	/** Live playhead position in master-timeline ms. */
	currentMs: number;
	/** Master duration in ms, shown next to the editable timecode. */
	durationMs: number;
	/** Whether "New cut" is actionable (playhead inside the trim window). */
	canAddCut: boolean;
	/** Called when "New cut" is pressed. */
	onAddCut: () => void;
	/** Called with the parsed timecode position in ms. */
	onSeek: ( ms: number ) => void;
	/** Current zoom factor (1 = fit). */
	zoom: number;
	/** Maximum zoom factor (the filmstrip's native-density ceiling). */
	zoomMax: number;
	/** Called with the requested zoom factor. */
	onZoomChange: ( zoom: number ) => void;
	/** Called when the user asks to fit the whole duration in the viewport. */
	onFit: () => void;
};

/**
 * The timeline toolbar.
 *
 * @param props              - Component props.
 * @param props.playing      - Whether preview playback is running.
 * @param props.onTogglePlay - Toggle preview playback.
 * @param props.currentMs    - Live playhead position in ms.
 * @param props.durationMs   - Master duration in ms.
 * @param props.canAddCut    - Whether "New cut" is actionable.
 * @param props.onAddCut     - Called when "New cut" is pressed.
 * @param props.onSeek       - Called with the parsed timecode position in ms.
 * @param props.zoom         - Current zoom factor.
 * @param props.zoomMax      - Maximum zoom factor.
 * @param props.onZoomChange - Called with the requested zoom factor.
 * @param props.onFit        - Called when "Fit" is pressed.
 * @return The toolbar element.
 */
export default function StudioEditorTimelineToolbar( {
	playing,
	onTogglePlay,
	currentMs,
	durationMs,
	canAddCut,
	onAddCut,
	onSeek,
	zoom,
	zoomMax,
	onZoomChange,
	onFit,
}: Props ): ReactElement {
	return (
		<div className="vp-studio-timeline__toolbar">
			<button
				type="button"
				className="vp-studio-timeline__transport"
				data-testid="studio-timeline-transport-play"
				aria-label={
					playing ? __( 'Pause', 'jetpack-videopress-pkg' ) : __( 'Play', 'jetpack-videopress-pkg' )
				}
				onClick={ onTogglePlay }
			>
				{ playing ? pauseIcon : playIcon }
			</button>
			<div className="vp-studio-timeline__time">
				<StudioEditorTimecodeBox valueMs={ currentMs } onSeek={ onSeek } />
				<span className="vp-studio-timeline__duration">
					{ `/ ${ formatTimecode( durationMs ) }` }
				</span>
			</div>
			<span className="vp-studio-timeline__toolbar-divider" aria-hidden="true" />
			<Button
				size="compact"
				variant="secondary"
				disabled={ ! canAddCut }
				onClick={ onAddCut }
				accessibleWhenDisabled
			>
				{ __( 'New cut', 'jetpack-videopress-pkg' ) }
			</Button>
			<StudioEditorZoomControl
				zoom={ zoom }
				zoomMax={ zoomMax }
				onZoomChange={ onZoomChange }
				onFit={ onFit }
			/>
		</div>
	);
}
