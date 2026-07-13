import { useParentSize } from '@visx/responsive';
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

		// Resolve containment from real layout, before paint. useParentSize measures
		// this wrapper, whose height:100% resolves to `auto` (= our own content) when
		// the parent has no definite height — so that measurement alone can't tell a
		// genuine constraint from our content reflected back, and clamping against it
		// deadlocks the chart at its current width on widen. Instead read the wrapper's
		// live height AFTER layout: when the parent constrains us it is shorter than the
		// height we drew (the content overflows) → contain to it; when it just reflects
		// our content the two match → grow. Latch the constraint until the parent is
		// tall enough for the full derived height again so a contained chart (which then
		// no longer overflows) doesn't oscillate. parentHeight is a dependency only so a
		// parent-height change re-runs this; the value used is the fresh clientHeight.
		useIsomorphicLayoutEffect( () => {
			if ( ! hasAspectRatio ) {
				if ( containedHeight !== null ) {
					setContainedHeight( null );
				}
				return;
			}
			const node = wrapperRef.current;
			if ( ! node ) {
				return;
			}
			const available = node.clientHeight;
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

		// The outer element fills the parent so its live height reflects the real
		// available space. With an aspectRatio the chart is placed in an inner box sized
		// to the contained dimensions (centered horizontally, top-aligned) so it keeps
		// its proportions and fits within the parent on both axes. Charts that fill their
		// container via CSS (e.g. the heatmap grid) then track that contained box. Without
		// an aspectRatio the chart fills the parent directly, exactly as before.
		return (
			<div
				ref={ setWrapperRef }
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
