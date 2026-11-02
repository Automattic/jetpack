import { useLayoutEffect, useState } from 'react';
import { PieSelectionAnnouncement } from './pie-selection-announcement';
import { PieTooltip } from './pie-tooltip';
import type { DataPointPercentageCalculated } from '../../../types';
import type { ReactNode, RefObject } from 'react';

interface Position {
	top: number;
	left: number;
}

interface PieSelectionOutputProps {
	withTooltips: boolean;
	selectedIndex?: number;
	/** The keyboard-selected segment's data. */
	selectedData?: DataPointPercentageCalculated;
	/** Where the keyboard tooltip points, in SVG coordinates. */
	keyboardTooltipAnchor?: Position;
	pointerTooltip?: { data?: DataPointPercentageCalculated; top: number; left: number };
	/** The element the tooltips are positioned in. */
	chartRef: RefObject< HTMLDivElement >;
	svgRef: RefObject< SVGSVGElement >;
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
	keyboardTooltipAnchor,
	pointerTooltip,
	chartRef,
	svgRef,
	tooltipRef,
	renderTooltip,
}: PieSelectionOutputProps ) => {
	const [ svgOffset, setSvgOffset ] = useState< Position >( { top: 0, left: 0 } );
	const showKeyboardTooltip = withTooltips && selectedData && keyboardTooltipAnchor;

	// Measured after commit, because during render the SVG still has the previous commit's size and position.
	// eslint-disable-next-line react-hooks/exhaustive-deps -- A resize re-renders this without changing any prop, and the bail-out below ends the chain.
	useLayoutEffect( () => {
		const chartBounds = chartRef.current?.getBoundingClientRect();
		const svgBounds = svgRef.current?.getBoundingClientRect();
		if ( ! showKeyboardTooltip || ! chartBounds || ! svgBounds ) {
			return;
		}
		const top = svgBounds.top - chartBounds.top;
		const left = svgBounds.left - chartBounds.left;
		setSvgOffset( current =>
			current.top === top && current.left === left ? current : { top, left }
		);
	} );

	return (
		<>
			<PieSelectionAnnouncement data={ withTooltips ? undefined : selectedData } />
			{ showKeyboardTooltip && (
				<PieTooltip
					top={ svgOffset.top + keyboardTooltipAnchor.top }
					left={ svgOffset.left + keyboardTooltipAnchor.left }
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
};
