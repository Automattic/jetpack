import { useParentSize } from '@visx/responsive';
import type { BaseChartProps, Optional } from '../../types';
import type { ComponentType } from 'react';

type ResponsiveConfig = {
	/**
	 * The maximum width of the chart. Defaults to 1200.
	 */
	maxWidth?: number;
	/**
	 * The aspect ratio of the chart.
	 */
	aspectRatio?: number;
	/**
	 * Child render updates upon resize are delayed until debounceTime milliseconds after the last resize event is observed.
	 */
	resizeDebounceTime?: number;
};

const useResponsiveDimensions = ( {
	resizeDebounceTime = 300,
	maxWidth = 1200,
	aspectRatio = 0.5,
}: ResponsiveConfig ) => {
	const { parentRef, width: parentWidth } = useParentSize( {
		debounceTime: resizeDebounceTime,
		enableDebounceLeadingCall: true,
	} );

	const containerWidth = parentWidth > 0 ? Math.min( parentWidth, maxWidth ) : 0;
	const containerHeight = containerWidth * aspectRatio;

	return { parentRef, width: containerWidth, height: containerHeight };
};

/**
 * A higher-order component that provides responsive dimensions
 * to the wrapped chart component using useParentSize from @visx/responsive.
 *
 * @param WrappedComponent - The chart component to be wrapped.
 * @return A functional component that renders the wrapped component with responsive dimensions.
 */
export function withResponsive< T extends Exclude< BaseChartProps< unknown >, 'options' > >( // 'options' is excluded so that each chart can define its own options type
	WrappedComponent: ComponentType< T >
) {
	return function ResponsiveChart( {
		resizeDebounceTime = 300,
		maxWidth = 1200,
		aspectRatio = 0.5,
		...chartProps
	}: Optional< T, 'width' | 'height' | 'size' > & ResponsiveConfig ) {
		const {
			parentRef,
			width: containerWidth,
			height: containerHeight,
		} = useResponsiveDimensions( {
			resizeDebounceTime,
			maxWidth,
			aspectRatio,
		} );

		return (
			<div
				ref={ parentRef }
				style={ {
					width: '100%',
					height: chartProps.height ?? 'auto',
				} }
			>
				<WrappedComponent
					width={ containerWidth }
					height={ containerHeight }
					size={ containerWidth }
					{ ...( chartProps as T ) }
				/>
			</div>
		);
	};
}
