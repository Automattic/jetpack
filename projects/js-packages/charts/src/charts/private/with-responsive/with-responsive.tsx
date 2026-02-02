import { useParentSize } from '@visx/responsive';
import type { BaseChartProps, Optional } from '../../../types';
import type { ComponentType } from 'react';

export type ResponsiveConfig = {
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
	/**
	 * When true, constrains the chart height to not exceed the parent container height.
	 * This prevents vertical scrollbars when the chart is inside a fixed-height container.
	 * Requires the parent container to have a defined height. Defaults to false.
	 */
	constrainToParentHeight?: boolean;
};

const useResponsiveDimensions = ( {
	resizeDebounceTime = 300,
	maxWidth = 1200,
	aspectRatio = 0.5,
	constrainToParentHeight = false,
}: ResponsiveConfig ) => {
	const {
		parentRef,
		width: parentWidth,
		height: parentHeight,
	} = useParentSize( {
		debounceTime: resizeDebounceTime,
		enableDebounceLeadingCall: true,
	} );

	const containerWidth = parentWidth > 0 ? Math.min( parentWidth, maxWidth ) : 0;
	const desiredHeight = containerWidth * aspectRatio;

	// Cap at parent height to prevent overflow when constrainToParentHeight is enabled
	const containerHeight =
		constrainToParentHeight && parentHeight > 0
			? Math.min( desiredHeight, parentHeight )
			: desiredHeight;

	return { parentRef, width: containerWidth, height: containerHeight };
};

/**
 * A higher-order component that provides responsive dimensions
 * to the wrapped chart component using useParentSize from `@visx/responsive`.
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
		constrainToParentHeight = false,
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
			constrainToParentHeight,
		} );

		// When constrainToParentHeight is enabled, use 100% height to fill the parent container
		const defaultHeight = constrainToParentHeight ? '100%' : 'auto';

		return (
			<div
				ref={ parentRef }
				data-testid="responsive-wrapper"
				style={ {
					width: chartProps.size ?? chartProps.width ?? '100%',
					height: chartProps.size ?? chartProps.height ?? defaultHeight,
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
