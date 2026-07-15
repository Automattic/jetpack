import { useParentSize } from '@visx/responsive';
import clsx from 'clsx';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
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

// useLayoutEffect on the client (so containment is resolved before paint, no flash),
// useEffect on the server to avoid React's SSR warning.
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

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
			width: parentWidth,
			height: parentHeight,
		} = useParentSize( {
			debounceTime: resizeDebounceTime,
			enableDebounceLeadingCall: true,
		} );

		const hasAspectRatio = aspectRatio !== undefined && aspectRatio > 0;

		// Keep our own handle on the wrapper so we can read its live height below, and
		// still hand the node to useParentSize's ref (a callback ref in practice; guard
		// the object-ref shape too).
		const wrapperRef = useRef< HTMLDivElement | null >( null );
		const setWrapperRef = useCallback(
			( node: HTMLDivElement | null ) => {
				wrapperRef.current = node;
				if ( typeof parentRef === 'function' ) {
					parentRef( node );
				} else if ( parentRef ) {
					( parentRef as { current: HTMLDivElement | null } ).current = node;
				}
			},
			[ parentRef ]
		);

		// The parent's available height when it actually constrains the chart, else
		// null (the chart derives its height from width and grows freely).
		const [ containedHeight, setContainedHeight ] = useState< number | null >( null );

		// Cap the available width at maxWidth unless an explicit width pins it. Before
		// measurement resolves, fall back to the explicit width.
		const cap = width === undefined ? maxWidth : Infinity;
		const availableWidth = parentWidth > 0 ? Math.min( parentWidth, cap ) : width ?? 0;

		let boxWidth = availableWidth;
		let boxHeight: number;
		if ( hasAspectRatio ) {
			const derivedHeight = availableWidth * aspectRatio;
			if ( containedHeight !== null && derivedHeight > containedHeight ) {
				boxHeight = containedHeight;
				boxWidth = boxHeight / aspectRatio;
			} else {
				boxHeight = derivedHeight;
			}
		} else {
			boxHeight = parentHeight > 0 ? parentHeight : height ?? 0;
		}

		// Decide containment from the wrapper's real height, measured after layout.
		// useParentSize's height is no good here: with height:100% and no definite
		// parent height it just echoes our own content back, so clamping against it
		// would freeze the chart at its current width when the container widens.
		// Compare the post-layout clientHeight to the height we drew: shorter means the
		// parent really constrains us → contain to it; equal means it is only our own
		// content → let it grow. Once contained, stay contained until the parent is tall
		// enough for the full derived height, so a now-fitting chart doesn't oscillate.
		// (parentHeight is in the deps only to re-run this; the value used is clientHeight.)
		useIsomorphicLayoutEffect( () => {
			if ( ! hasAspectRatio ) {
				if ( containedHeight !== null ) {
					setContainedHeight( null );
				}
				return;
			}
			const available = wrapperRef.current?.clientHeight ?? 0;
			const derivedHeight = availableWidth * aspectRatio;
			if ( containedHeight === null ) {
				if ( available > 0 && derivedHeight > available + 1 ) {
					setContainedHeight( available );
				}
			} else if ( available >= derivedHeight - 1 ) {
				setContainedHeight( null );
			} else if ( Math.abs( available - containedHeight ) > 1 ) {
				setContainedHeight( available );
			}
		}, [ hasAspectRatio, availableWidth, aspectRatio, containedHeight, parentHeight ] );

		const wrappedComponent = (
			<WrappedComponent
				width={ boxWidth }
				height={ boxHeight }
				size={ size }
				{ ...( chartProps as T ) }
			/>
		);

		// The outer element fills the parent (via CSS) so its live height reflects the
		// real available space; JS sets width/height only when they are passed
		// explicitly. With an aspectRatio the chart is placed in an inner box whose width
		// is set here and whose height follows from the CSS aspect-ratio, so it keeps its
		// proportions and fits within the parent on both axes (centered by CSS). Charts
		// that fill their container via CSS (e.g. the heatmap grid) then track that box.
		// Without an aspectRatio the chart fills the parent directly.
		return (
			<div
				ref={ setWrapperRef }
				data-testid="responsive-wrapper"
				className={ clsx( styles.container, hasAspectRatio && styles.isContained ) }
				style={ {
					...( width !== undefined ? { width } : null ),
					...( height !== undefined ? { height } : null ),
				} }
			>
				{ hasAspectRatio ? (
					<div
						data-testid="responsive-content"
						className={ styles.content }
						style={ { width: boxWidth, aspectRatio: `1 / ${ aspectRatio }` } }
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
