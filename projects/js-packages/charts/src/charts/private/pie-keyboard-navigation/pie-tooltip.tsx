import { BoundedTooltip } from '../../../components/tooltip/private/bounded-tooltip';
import { useStandaloneScopeClass } from '../../../providers/chart-scope';
import type { ReactNode } from 'react';

interface PieTooltipProps {
	top: number;
	left: number;
	/** Set while a keyboard selection drives the tooltip, which then takes focus. */
	selectedIndex?: number;
	tooltipRef?: ( element: HTMLDivElement | null ) => void;
	children: ReactNode;
}

export const PieTooltip = ( {
	top,
	left,
	selectedIndex,
	tooltipRef,
	children,
}: PieTooltipProps ) => {
	const standaloneScopeClass = useStandaloneScopeClass();

	return (
		<BoundedTooltip top={ top } left={ left }>
			{ selectedIndex === undefined ? (
				<div className={ standaloneScopeClass } role="tooltip">
					{ children }
				</div>
			) : (
				<div
					ref={ tooltipRef }
					tabIndex={ -1 }
					role="tooltip"
					aria-atomic="true"
					className={ standaloneScopeClass }
					data-testid={ `chart-tooltip-${ selectedIndex }` }
					key={ `chart-tooltip-${ selectedIndex }` }
				>
					{ children }
				</div>
			) }
		</BoundedTooltip>
	);
};
