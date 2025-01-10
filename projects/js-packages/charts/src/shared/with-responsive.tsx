import { useParentSize } from '@visx/responsive';
import { ComponentType } from 'react';
import type { BaseChartProps } from './types';

type ResponsiveConfig = {
	maxWidth?: number;
	aspectRatio?: number;
	debounceTime?: number;
};

/**
 * A higher-order component that provides responsive width and height
 * to the wrapped chart component using useParentSize from @visx/responsive.
 *
 * @param WrappedComponent - The chart component to be wrapped.
 * @param config           - Optional configuration for responsive behavior
 * @return A functional component that renders the wrapped component with responsive dimensions.
 */
export function withResponsive< T extends BaseChartProps< unknown > >(
	WrappedComponent: ComponentType< T >,
	config?: ResponsiveConfig
) {
	const { maxWidth = 1200, aspectRatio = 0.5, debounceTime = 50 } = config || {};

	return function ResponsiveChart( props: Omit< T, 'width' | 'height' > ) {
		const { parentRef, width: parentWidth } = useParentSize( {
			debounceTime,
			initialSize: { width: 600, height: 400 },
		} );

		// Calculate dimensions
		const containerWidth = Math.min( parentWidth || 0, maxWidth );
		const containerHeight = containerWidth * aspectRatio;

		return (
			<div
				ref={ parentRef }
				style={ {
					width: '100%',
					position: 'relative', // Ensure proper size calculation
					aspectRatio: `${ 1 / aspectRatio }`, // Use CSS aspect-ratio
				} }
			>
				<WrappedComponent
					{ ...( props as T ) }
					width={ containerWidth || 600 } // Fallback to prevent 0 width
					height={ containerHeight || 400 } // Fallback to prevent 0 height
				/>
			</div>
		);
	};
}
