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
	const {
		maxWidth = 1200,
		aspectRatio = 0.5, // 2:1 aspect ratio
		debounceTime = 50,
	} = config || {};

	return function ResponsiveChart( props: Omit< T, 'width' | 'height' > ) {
		const {
			parentRef,
			width: parentWidth,
			height: parentHeight,
		} = useParentSize( {
			debounceTime,
			initialSize: { width: 600, height: 400 },
		} );

		// Calculate dimensions maintaining aspect ratio
		const containerWidth = Math.min( parentWidth, maxWidth );
		const containerHeight = Math.min( parentHeight, containerWidth * aspectRatio );

		return (
			<div
				ref={ parentRef }
				style={ {
					width: '100%',
					height: '100%',
					margin: '0 auto',
				} }
			>
				<WrappedComponent
					{ ...( props as T ) }
					width={ containerWidth }
					height={ containerHeight }
				/>
			</div>
		);
	};
}
