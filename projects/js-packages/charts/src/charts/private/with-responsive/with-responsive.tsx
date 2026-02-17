import { useParentSize } from '@visx/responsive';
import styles from './with-responsive.module.scss';
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

		// Use measured dimensions, but fall back to explicit props if measurement returns 0
		// (e.g., during initial render or in test environments without DOM measurement)
		const effectiveWidth = measuredWidth || size || width || 0;
		const effectiveHeight = measuredHeight || size || height || 0;

		const defaultHeight = hasAspectRatio ? 'auto' : '100%';

		return (
			<div
				ref={ parentRef }
				data-testid="responsive-wrapper"
				className={ styles.container }
				style={ {
					width: size ?? width ?? '100%',
					height: size ?? height ?? defaultHeight,
				} }
			>
				<WrappedComponent
					width={ effectiveWidth }
					height={ effectiveHeight }
					size={ effectiveWidth }
					{ ...( chartProps as T ) }
				/>
			</div>
		);
	};
}
