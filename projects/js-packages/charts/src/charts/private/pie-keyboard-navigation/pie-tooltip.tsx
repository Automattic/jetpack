import {
	BoundedTooltip,
	TOOLTIP_Z_INDEX,
} from '../../../components/tooltip/private/bounded-tooltip';
import { useStandaloneScopeClass } from '../../../providers/chart-scope';
import type { CSSProperties, ReactNode } from 'react';

const TOOLTIP_BOX_STYLE: CSSProperties = { zIndex: TOOLTIP_Z_INDEX };

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
		<BoundedTooltip top={ top } left={ left } style={ TOOLTIP_BOX_STYLE }>
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
