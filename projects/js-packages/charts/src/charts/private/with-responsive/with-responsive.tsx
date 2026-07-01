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

		// Use measured dimensions, but fall back to explicit width/height props if measurement returns 0
		// (e.g., during initial render or in test environments without DOM measurement).
		// Do not use size here — size controls chart element dimensions (e.g. pie diameter), not container dimensions.
		const effectiveWidth = measuredWidth || width || 0;
		const effectiveHeight = measuredHeight || height || 0;

		const defaultHeight = hasAspectRatio ? 'auto' : '100%';
		// Express the aspect ratio in CSS so the container height tracks its width
		// fluidly, rather than snapping to a debounced measured height. Cap the width
		// at maxWidth so the CSS-derived height matches the maxWidth-capped content
		// (the wrapped chart is sized from the capped `measuredWidth`).
		const aspectRatioStyle =
			hasAspectRatio && aspectRatio
				? {
						aspectRatio: `${ 1 / aspectRatio }`,
						maxWidth: width === undefined ? maxWidth : undefined,
				  }
				: null;

		return (
			<div
				ref={ parentRef }
				data-testid="responsive-wrapper"
				className={ styles.container }
				style={ {
					width: width ?? '100%',
					height: height ?? defaultHeight,
					...aspectRatioStyle,
				} }
			>
				<WrappedComponent
					width={ effectiveWidth }
					height={ effectiveHeight }
					size={ size }
					{ ...( chartProps as T ) }
				/>
			</div>
		);
	};
}
