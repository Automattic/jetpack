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
	 * When provided, the chart keeps this ratio and is contained within the
	 * parent on both axes: it fills the available width and derives its height,
	 * but if the parent is shorter than that derived height it shrinks both axes
	 * to fit rather than overflowing. When it is narrower than the parent (the
	 * height-constrained case) it is centered horizontally.
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
	explicitWidth,
	explicitHeight,
}: ResponsiveConfig & { explicitWidth?: number; explicitHeight?: number } ) => {
	const {
		parentRef,
		width: parentWidth,
		height: parentHeight,
	} = useParentSize( {
		debounceTime: resizeDebounceTime,
		enableDebounceLeadingCall: true,
	} );

	const hasAspectRatio = aspectRatio !== undefined && aspectRatio > 0;

	// Cap the available width at maxWidth unless an explicit width pins it. Before
	// measurement resolves, fall back to the explicit width.
	const cap = explicitWidth === undefined ? maxWidth : Infinity;
	const availableWidth = parentWidth > 0 ? Math.min( parentWidth, cap ) : explicitWidth ?? 0;

	let width = availableWidth;
	let height: number;

	if ( hasAspectRatio ) {
		height = availableWidth * aspectRatio;
		// Contain: when the parent bounds the height and the width-derived height
		// would overflow it, shrink both axes to fit, preserving the ratio. The 1px
		// slack keeps the self-referential auto-height case — a parent with no height
		// of its own collapses onto this box, so measured height ≈ derived height —
		// from clamping against itself.
		if ( parentHeight > 0 && height > parentHeight + 1 ) {
			height = parentHeight;
			width = height / aspectRatio;
		}
	} else {
		height = parentHeight > 0 ? parentHeight : explicitHeight ?? 0;
	}

	return { parentRef, width, height, hasAspectRatio };
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
			width: boxWidth,
			height: boxHeight,
			hasAspectRatio,
		} = useResponsiveDimensions( {
			resizeDebounceTime,
			maxWidth,
			aspectRatio,
			explicitWidth: width,
			explicitHeight: height,
		} );

		const wrappedComponent = (
			<WrappedComponent
				width={ boxWidth }
				height={ boxHeight }
				size={ size }
				{ ...( chartProps as T ) }
			/>
		);

		// The outer element fills the parent so useParentSize can measure the true
		// available width AND height. With an aspectRatio the chart is placed in an
		// inner box sized to the contained dimensions (centered horizontally, top-
		// aligned) so it keeps its proportions and fits within the parent on both
		// axes. Charts that fill their container via CSS (e.g. the heatmap grid) then
		// track that contained box. Without an aspectRatio the chart fills the parent
		// directly, exactly as before.
		return (
			<div
				ref={ parentRef }
				data-testid="responsive-wrapper"
				className={ styles.container }
				style={ {
					width: width ?? '100%',
					height: height ?? '100%',
					...( hasAspectRatio
						? { display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }
						: null ),
				} }
			>
				{ hasAspectRatio ? (
					<div
						data-testid="responsive-content"
						className={ styles.content }
						style={ { width: boxWidth, height: boxHeight } }
					>
						{ wrappedComponent }
					</div>
				) : (
					wrappedComponent
				) }
			</div>
		);
	};
}
