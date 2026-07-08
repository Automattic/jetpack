/**
 * Toolbar row above the Studio editor timeline, per the editor redesign:
 * the shared transport (play/pause icon button + editable timecode +
 * duration), the "New cut" action, and the selected-cut chip on the left,
 * the zoom control (Fit + four-stop slider) on the right.
 */
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import StudioEditorCutChip from './cut-chip';
import StudioTimelineTransport from './transport';
import StudioEditorZoomControl from './zoom-control';
import type { ZoomLadder } from './filmstrip-geometry';
import type { CutRange } from '../state/edit-session';
import type { ReactElement } from 'react';

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
	/** The selected cut, shown as the removable chip; null hides the chip. */
	selectedCut: CutRange | null;
	/** Called with a cut id when the chip's trash button is pressed. */
	onRemoveCut: ( id: string ) => void;
	/** Called with the parsed timecode position in ms. */
	onSeek: ( ms: number ) => void;
	/** Current zoom factor (1 = fit). */
	zoom: number;
	/** The filmstrip's zoom ladder (native-density anchor + densified stops). */
	zoomLadder: ZoomLadder;
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
 * @param props.selectedCut  - The selected cut, shown as the removable chip.
 * @param props.onRemoveCut  - Called with a cut id to remove it.
 * @param props.onSeek       - Called with the parsed timecode position in ms.
 * @param props.zoom         - Current zoom factor.
 * @param props.zoomLadder   - The filmstrip's zoom ladder.
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
	selectedCut,
	onRemoveCut,
	onSeek,
	zoom,
	zoomLadder,
	onZoomChange,
	onFit,
}: Props ): ReactElement {
	return (
		<div className="vp-studio-timeline__toolbar">
			<StudioTimelineTransport
				playing={ playing }
				onTogglePlay={ onTogglePlay }
				currentMs={ currentMs }
				durationMs={ durationMs }
				onSeek={ onSeek }
			/>
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
			{ selectedCut && (
				<StudioEditorCutChip cut={ selectedCut } onRemove={ () => onRemoveCut( selectedCut.id ) } />
			) }
			<StudioEditorZoomControl
				zoom={ zoom }
				ladder={ zoomLadder }
				onZoomChange={ onZoomChange }
				onFit={ onFit }
			/>
		</div>
	);
}
