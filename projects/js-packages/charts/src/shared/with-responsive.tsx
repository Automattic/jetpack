import { useScreenSize } from '@visx/responsive';
import { ComponentType } from 'react';
import type { BaseChartProps } from './types';

/**
 * A higher-order component that provides responsive width and height
 * to the wrapped chart component using useScreenSize from @visx/responsive.
 *
 * @param WrappedComponent - The chart component to be wrapped.
 * @return A functional component that renders the wrapped component with responsive dimensions.
 */
export function withResponsive< T extends BaseChartProps< unknown > >(
	WrappedComponent: ComponentType< T >
) {
	return function ResponsiveChart( props: Omit< T, 'width' | 'height' > ) {
		const { width: screenWidth } = useScreenSize( {
			debounceTime: 50,
			initialSize: { width: 600, height: 400 },
		} );

		// Calculate dimensions maintaining aspect ratio
		const containerWidth = Math.min( screenWidth - 40, 1200 ); // max width with padding
		const containerHeight = containerWidth * 0.5; // 2:1 aspect ratio

		return (
			<div
				style={ {
					width: containerWidth,
					height: containerHeight,
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
