import { useParentSize } from '@visx/responsive';
import clsx from 'clsx';
import { useCallback, useRef, useState } from 'react';
import { useIsomorphicLayoutEffect } from '../../../hooks';
import { ChartScopeContext } from '../../../providers/chart-scope';
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

export type ResponsiveOptions = {
	/**
	 * Hold the chart back until the box has been measured, which is what keeps a chart that
	 * draws its geometry from that box from painting once at the wrong size. Defaults to true:
	 * a chart that lays itself out from its own content has nothing to gain by waiting and may
	 * turn it off, which costs it nothing, where forgetting to turn it on brings the jump back.
	 */
	waitForSize?: boolean;
};

/**
 * A higher-order component that provides responsive dimensions
 * to the wrapped chart component using useParentSize from `@visx/responsive`.
 *
 * @param WrappedComponent    - The chart component to be wrapped.
 * @param options             - Options for the wrapper.
 * @param options.waitForSize - Whether to hold the chart back until the box is measured.
 * @return A functional component that renders the wrapped component with responsive dimensions.
 */
export function withResponsive< T extends Exclude< BaseChartProps< unknown >, 'options' > >( // 'options' is excluded so that each chart can define its own options type
	WrappedComponent: ComponentType< T >,
	{ waitForSize = true }: ResponsiveOptions = {}
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

		// The context needs a re-render when the node attaches; wrapperRef alone cannot provide that, so mirror the node into state from the same callback ref.
		const [ scopeNode, setScopeNode ] = useState< HTMLDivElement | null >( null );

		// Keep our own handle on the wrapper so we can read its live height below, and
		// still hand the node to useParentSize's ref (a callback ref in practice; guard
		// the object-ref shape too).
		const wrapperRef = useRef< HTMLDivElement | null >( null );
		const setWrapperRef = useCallback(
			( node: HTMLDivElement | null ) => {
				wrapperRef.current = node;
				setScopeNode( node );
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
		const availableWidth = parentWidth > 0 ? Math.min( parentWidth, cap ) : ( width ?? 0 );

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
			boxHeight = parentHeight > 0 ? parentHeight : ( height ?? 0 );
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

		// Handed 0×0, a chart paints at a size it loses a frame later, and jumps. Width and
		// height report together, so a measured width settles the height with or without a
		// definite one.
		const isMeasured = parentWidth > 0;
		const hasDimensions = boxWidth > 0 && ( boxHeight > 0 || isMeasured );

		// Only the first paint waits: a hidden ancestor measures the chart at 0×0, and
		// unmounting it there would drop its zoom and series state.
		const hasBeenSized = useRef( ! waitForSize );
		hasBeenSized.current = hasBeenSized.current || hasDimensions;

		// A shrink-to-fit parent takes its width from this wrapper, whose own width is a
		// percentage of it, so waiting would pin both at 0 for good. Give up once for a box that
		// is laid out and still measures 0; display:none leaves no box, and that one can wait.
		const [ hasNoSizeToWaitFor, setHasNoSizeToWaitFor ] = useState( false );
		useIsomorphicLayoutEffect( () => {
			if ( hasBeenSized.current || hasNoSizeToWaitFor ) {
				return;
			}
			const node = wrapperRef.current;
			if ( node && node.getClientRects().length > 0 && node.clientWidth === 0 ) {
				setHasNoSizeToWaitFor( true );
			}
		} );

		const wrappedComponent =
			hasBeenSized.current || hasNoSizeToWaitFor ? (
				<WrappedComponent
					width={ boxWidth }
					height={ boxHeight }
					size={ size }
					{ ...( chartProps as T ) }
				/>
			) : null;

		// The outer element fills the parent (via CSS) so its live height reflects the
		// real available space; JS sets width/height only when they are passed
		// explicitly. Static layout (fill, flex centering) lives in the stylesheet. With
		// an aspectRatio the chart is placed in an inner box sized to the contained
		// dimensions (centered by CSS) so it keeps its proportions and fits within the
		// parent on both axes. Charts that fill their container via CSS (e.g. the heatmap
		// grid) then track that box. Without an aspectRatio the chart fills the parent.
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
				<ChartScopeContext.Provider value={ scopeNode }>
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
				</ChartScopeContext.Provider>
			</div>
		);
	};
}
