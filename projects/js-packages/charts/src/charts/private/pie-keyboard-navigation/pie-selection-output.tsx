import { PieSelectionAnnouncement } from './pie-selection-announcement';
import { PieTooltip } from './pie-tooltip';
import type { DataPointPercentageCalculated } from '../../../types';
import type { ReactNode } from 'react';

interface PieSelectionOutputProps {
	withTooltips: boolean;
	selectedIndex?: number;
	/** The keyboard-selected segment's data. */
	selectedData?: DataPointPercentageCalculated;
	keyboardTooltipPosition?: { top: number; left: number };
	pointerTooltip?: { data?: DataPointPercentageCalculated; top: number; left: number };
	tooltipRef: ( element: HTMLDivElement | null ) => void;
	renderTooltip: ( params: { tooltipData: DataPointPercentageCalculated } ) => ReactNode;
}

/**
 * Reports the selected segment: a focused tooltip for a keyboard selection, a pointer tooltip on hover, or a screen reader announcement without tooltips.
 *
 * @param {PieSelectionOutputProps} props - Component props
 * @return {JSX.Element} The announcement region and the tooltip, if any
 */
export const PieSelectionOutput = ( {
	withTooltips,
	selectedIndex,
	selectedData,
	keyboardTooltipPosition,
	pointerTooltip,
	tooltipRef,
	renderTooltip,
}: PieSelectionOutputProps ) => (
	<>
		<PieSelectionAnnouncement data={ withTooltips ? undefined : selectedData } />
		{ withTooltips && selectedData && keyboardTooltipPosition && (
			<PieTooltip
				{ ...keyboardTooltipPosition }
				selectedIndex={ selectedIndex }
				tooltipRef={ tooltipRef }
			>
				{ renderTooltip( { tooltipData: selectedData } ) }
			</PieTooltip>
		) }
		{ withTooltips && ! selectedData && pointerTooltip?.data && (
			<PieTooltip top={ pointerTooltip.top } left={ pointerTooltip.left }>
				{ renderTooltip( { tooltipData: pointerTooltip.data } ) }
			</PieTooltip>
		) }
	</>
);
