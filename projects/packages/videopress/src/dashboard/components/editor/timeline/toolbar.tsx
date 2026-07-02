/**
 * Toolbar row above the Studio editor timeline: the "New cut" action, the
 * editable playhead timecode, and the zoom control.
 */
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import StudioEditorTimecodeBox from './timecode-box';
import StudioEditorZoomControl from './zoom-control';
import type { ReactElement } from 'react';

type Props = {
	/** Live playhead position in master-timeline ms. */
	currentMs: number;
	/** Whether "New cut" is actionable (playhead inside the trim window). */
	canAddCut: boolean;
	/** Called when "New cut" is pressed. */
	onAddCut: () => void;
	/** Called with the parsed timecode position in ms. */
	onSeek: ( ms: number ) => void;
	/** Current zoom factor (1 = fit). */
	zoom: number;
	/** Called with the requested zoom factor. */
	onZoomChange: ( zoom: number ) => void;
	/** Called when the user asks to fit the whole duration in the viewport. */
	onFit: () => void;
};

/**
 * The timeline toolbar.
 *
 * @param props              - Component props.
 * @param props.currentMs    - Live playhead position in ms.
 * @param props.canAddCut    - Whether "New cut" is actionable.
 * @param props.onAddCut     - Called when "New cut" is pressed.
 * @param props.onSeek       - Called with the parsed timecode position in ms.
 * @param props.zoom         - Current zoom factor.
 * @param props.onZoomChange - Called with the requested zoom factor.
 * @param props.onFit        - Called when "Fit" is pressed.
 * @return The toolbar element.
 */
export default function StudioEditorTimelineToolbar( {
	currentMs,
	canAddCut,
	onAddCut,
	onSeek,
	zoom,
	onZoomChange,
	onFit,
}: Props ): ReactElement {
	return (
		<div className="vp-studio-timeline__toolbar">
			<Button
				size="compact"
				variant="secondary"
				disabled={ ! canAddCut }
				onClick={ onAddCut }
				accessibleWhenDisabled
			>
				{ __( 'New cut', 'jetpack-videopress-pkg' ) }
			</Button>
			<StudioEditorTimecodeBox valueMs={ currentMs } onSeek={ onSeek } />
			<StudioEditorZoomControl zoom={ zoom } onZoomChange={ onZoomChange } onFit={ onFit } />
		</div>
	);
}
