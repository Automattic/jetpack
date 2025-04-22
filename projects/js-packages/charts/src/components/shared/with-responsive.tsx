import { useParentSize } from '@visx/responsive';
import { ComponentType } from 'react';
import type { BaseChartProps, Optional } from '../../types';

type ResponsiveConfig = {
	maxWidth?: number;
	aspectRatio?: number;
	debounceTime?: number;
	useSingleDimension?: boolean;
};

/**
 * A higher-order component that provides responsive dimensions
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

	return function ResponsiveChart( props: Optional< T, 'width' | 'height' | 'size' > ) {
		const { parentRef, width: parentWidth } = useParentSize( {
			debounceTime,
			enableDebounceLeadingCall: true,
			initialSize: { width: 600, height: 400 },
		} );

		// Calculate dimensions
		const containerWidth = parentWidth ? Math.min( parentWidth, maxWidth ) : 600;
		const containerHeight = props.height ?? containerWidth * aspectRatio;

		return (
			<div
				ref={ parentRef }
				style={ {
					width: '100%',
				} }
			>
				<WrappedComponent
					width={ containerWidth }
					height={ containerHeight }
					size={ containerWidth }
					{ ...( props as T ) }
				/>
			</div>
		);
	};
}
