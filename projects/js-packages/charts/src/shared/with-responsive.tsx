import { ParentSize } from '@visx/responsive';
import { FC, ComponentType } from 'react';
import type { BaseChartProps } from '../types';

/**
 * A higher-order component that provides responsive width and height
 * to the wrapped chart component using ParentSize from @visx/responsive.
 *
 * @param WrappedComponent - The chart component to be wrapped.
 * @return A functional component that renders the wrapped component with responsive dimensions.
 */
export function withResponsive< T extends BaseChartProps< unknown > >(
	WrappedComponent: ComponentType< T >
): FC< Omit< T, 'width' | 'height' > > {
	const DEFAULT_SIZE = 300;

	return function ResponsiveChart( props ) {
		return (
			<ParentSize>
				{ ( { width, height } ) => (
					<WrappedComponent
						{ ...( props as T ) }
						width={ width > 0 ? width : DEFAULT_SIZE }
						height={ height > 0 ? height : DEFAULT_SIZE }
					/>
				) }
			</ParentSize>
		);
	};
}
