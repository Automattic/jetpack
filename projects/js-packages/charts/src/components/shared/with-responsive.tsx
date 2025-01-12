import { useParentSize } from '@visx/responsive';
import { ComponentType } from 'react';
import type { BaseChartProps } from '../../types';

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
			enableDebounceLeadingCall: true,
			initialSize: { width: 600, height: 400 },
		} );

		// Calculate dimensions
		const containerWidth = parentWidth ? Math.min( parentWidth, maxWidth ) : 600;
		const containerHeight = containerWidth * aspectRatio;

		return (
			<div
				ref={ parentRef }
				style={ {
					width: '100%',
					minHeight: `${ containerHeight }px`,
				} }
			>
				<WrappedComponent
					width={ containerWidth }
					height={ containerHeight }
					// When width and height are passed as props, they will override the responsive values, and the chart will become fixed size.
					{ ...( props as T ) }
				/>
			</div>
		);
	};
}
