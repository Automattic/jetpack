import { useParentSize } from '@visx/responsive';
import type { BaseChartProps } from '../../../types';
import type { ComponentType } from 'react';

type DimensionProps = {
	width?: number;
	height?: number;
	size?: number;
};

export type ResponsiveConfig = {
	/**
	 * The maximum width of the chart. Defaults to 1200.
	 */
	maxWidth?: number;
	/**
	 * The aspect ratio of the chart (height = width * aspectRatio).
	 * When provided, height is calculated from width.
	 * When omitted, the chart fills the parent container's height.
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
	aspectRatio,
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
	const containerHeight = aspectRatio !== undefined ? containerWidth * aspectRatio : parentHeight;

	return {
		parentRef,
		width: containerWidth,
		height: containerHeight,
		/**
		 * Whether an aspectRatio was provided. Used to determine container
		 * height styling: 'auto' when true (height derived from width),
		 * '100%' when false (fill parent container).
		 */
		hasAspectRatio: aspectRatio !== undefined,
	};
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
		aspectRatio,
		size,
		width,
		height,
		...chartProps
	}: Omit< T, 'width' | 'height' | 'size' > & DimensionProps & ResponsiveConfig ) {
		const {
			parentRef,
			width: measuredWidth,
			height: measuredHeight,
			hasAspectRatio,
		} = useResponsiveDimensions( {
			resizeDebounceTime,
			maxWidth,
			aspectRatio,
		} );

		return (
			<div
				ref={ parentRef }
				data-testid="responsive-wrapper"
				style={ {
					width: size ?? width ?? '100%',
					height: hasAspectRatio ? size ?? height ?? 'auto' : size ?? height ?? '100%',
				} }
			>
				<WrappedComponent
					width={ measuredWidth }
					height={ measuredHeight }
					size={ measuredWidth }
					{ ...( chartProps as T ) }
				/>
			</div>
		);
	};
}
