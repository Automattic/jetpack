/**
 * The selected-cut chip in the timeline toolbar: a red-striped swatch echoing
 * the strip's cut segments, the cut's mono timecode range, how much time it
 * removes, and a trash button that removes the cut. Rendered only while a
 * cut is selected.
 */
import { Button } from '@wordpress/components';
import { sprintf, __ } from '@wordpress/i18n';
import { Icon, trash } from '@wordpress/icons';
import { formatTimecode } from '../state/time-utils';
import type { CutRange } from '../state/edit-session';
import type { ReactElement } from 'react';

type Props = {
	/** The selected cut the chip describes. */
	cut: CutRange;
	/** Remove the cut (the trash button). */
	onRemove: () => void;
};

/**
 * The selected-cut chip.
 *
 * @param props          - Component props.
 * @param props.cut      - The selected cut.
 * @param props.onRemove - Remove the cut.
 * @return The chip element.
 */
export default function StudioEditorCutChip( { cut, onRemove }: Props ): ReactElement {
	const removedSeconds = ( ( cut.endMs - cut.startMs ) / 1000 ).toFixed( 1 );

	return (
		<div className="vp-studio-timeline__cut-chip" data-testid="studio-timeline-cut-chip">
			<span className="vp-studio-timeline__cut-chip-swatch" aria-hidden="true" />
			<span className="vp-studio-timeline__cut-chip-range">
				{ `${ formatTimecode( cut.startMs ) } – ${ formatTimecode( cut.endMs ) }` }
			</span>
			<span className="vp-studio-timeline__cut-chip-removed">
				{ sprintf(
					/* translators: %s: removed duration in seconds, e.g. "3.4". */
					__( '%ss removed', 'jetpack-videopress-pkg' ),
					removedSeconds
				) }
			</span>
			<Button
				className="vp-studio-timeline__cut-chip-remove"
				size="small"
				icon={ <Icon icon={ trash } size={ 16 } /> }
				label={ __( 'Remove cut', 'jetpack-videopress-pkg' ) }
				onClick={ onRemove }
			/>
		</div>
	);
}
