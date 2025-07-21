import { Legend } from './legend';
import type { LegendProps } from './types';
import type { FC } from 'react';

export interface ChartLegendProps extends LegendProps {
	position?: 'top' | 'bottom' | 'left' | 'right';
	align?: 'start' | 'center' | 'end';
}

/**
 * Enhanced Legend component with simplified position and align props.
 *
 * Provides a more intuitive API while maintaining backward compatibility
 * with the existing Legend component.
 *
 * @param props                     - Component props
 * @param props.position            - Where to position the legend (top, bottom, left, right)
 * @param props.align               - How to align the legend within its position (start, center, end)
 * @param props.orientation         - Override computed orientation
 * @param props.alignmentHorizontal - Override computed horizontal alignment
 * @param props.alignmentVertical   - Override computed vertical alignment
 * @return The rendered legend component
 */
export const ChartLegend: FC< ChartLegendProps > = ( {
	position = 'bottom',
	align = 'center',
	orientation,
	alignmentHorizontal,
	alignmentVertical,
	...props
} ) => {
	// Convert position/align to existing orientation/alignment props, but allow explicit overrides
	const computedOrientation =
		orientation || ( position === 'left' || position === 'right' ? 'vertical' : 'horizontal' );

	const computedAlignmentHorizontal =
		alignmentHorizontal ||
		( () => {
			if ( position === 'left' ) return 'left';
			if ( position === 'right' ) return 'right';
			// For top/bottom positions, use align prop
			switch ( align ) {
				case 'start':
					return 'left';
				case 'end':
					return 'right';
				case 'center':
				default:
					return 'center';
			}
		} )();

	const computedAlignmentVertical = alignmentVertical || ( position === 'top' ? 'top' : 'bottom' );

	return (
		<Legend
			orientation={ computedOrientation }
			alignmentHorizontal={ computedAlignmentHorizontal }
			alignmentVertical={ computedAlignmentVertical }
			{ ...props }
		/>
	);
};
