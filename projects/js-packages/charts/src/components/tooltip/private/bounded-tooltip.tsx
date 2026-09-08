import { Tooltip, defaultStyles } from '@visx/tooltip';
import { useLayoutEffect, useRef, useState } from 'react';
import type { TooltipPlacement } from '../../../visx/types';
import type { TooltipProps } from '@visx/tooltip';

type Bounds = { left: number; top: number; right: number; bottom: number };
type Size = { width: number; height: number };

export type BoundedTooltipProps = Omit< TooltipProps, 'left' | 'top' | 'applyPositionStyle' > & {
	/** Anchor, in the coordinates of the positioned wrapper the box renders into. */
	left?: number;
	top?: number;
	placement?: TooltipPlacement;
};

const DEFAULT_OFFSET = 10;
const POINTER_HEIGHT = 6;

const clamp = ( position: number, min: number, max: number, size: number ) =>
	Math.min( Math.max( position, min ), Math.max( min, max - size ) );

const isClipping = ( element: Element ) => {
	const { overflow, overflowX, overflowY } = getComputedStyle( element );
	return [ overflow, overflowX, overflowY ].some( value => value && value !== 'visible' );
};

// The first ancestor that cuts its overflow off. The box may leave the chart
// wrapper but never this element, which is what a body-level portal used to
// guarantee by never being inside one.
const findClippingAncestor = ( wrapper: Element ): Element | null => {
	let element = wrapper.parentElement;
	while ( element && element !== document.body ) {
		if ( isClipping( element ) ) {
			return element;
		}
		element = element.parentElement;
	}
	return null;
};

/**
 * Flip and clamp the box in wrapper coordinates, or pin it below the axis
 * with horizontal clamping only.
 *
 * @param params            - Anchor, offsets, the box size and the bounds to keep inside.
 * @param params.left       - Anchor x, in wrapper coordinates.
 * @param params.top        - Anchor y, in wrapper coordinates.
 * @param params.offsetLeft - Gap between the anchor and the box, horizontally.
 * @param params.offsetTop  - Gap between the anchor and the box, vertically.
 * @param params.box        - Rendered size of the box.
 * @param params.placement  - Fixed below-axis placement or automatic flipping.
 * @param params.bounds     - Edges the box must keep inside, in wrapper coordinates.
 * @return The box's top-left corner; fixed placement preserves the axis's subpixel y.
 */
export const getBoundedPosition = ( {
	left,
	top,
	offsetLeft,
	offsetTop,
	box,
	bounds,
	placement = 'auto',
}: {
	left: number;
	top: number;
	offsetLeft: number;
	offsetTop: number;
	box: Size;
	bounds: Bounds;
	placement?: BoundedTooltipProps[ 'placement' ];
} ) => {
	if ( placement === 'below-axis' ) {
		return {
			x: Math.round( clamp( left - box.width / 2, bounds.left, bounds.right, box.width ) ),
			y: top + POINTER_HEIGHT,
		};
	}

	const rightX = left + offsetLeft;
	const leftX = left - offsetLeft - box.width;
	const rightOverflow = rightX + box.width - bounds.right;
	const leftOverflow = bounds.left - leftX;
	let x = rightOverflow > 0 && rightOverflow > leftOverflow ? leftX : rightX;

	const downY = top + offsetTop;
	const upY = top - offsetTop - box.height;
	const downOverflow = downY + box.height - bounds.bottom;
	const upOverflow = bounds.top - upY;
	let y = downOverflow > 0 && downOverflow > upOverflow ? upY : downY;

	x = clamp( x, bounds.left, bounds.right, box.width );
	y = clamp( y, bounds.top, bounds.bottom, box.height );

	return {
		x: Math.round( x ),
		y: Math.round( y ),
	};
};

/**
 * Position visx's `Tooltip` against the nearest clipping ancestor or viewport.
 * Below-axis placement applies horizontal bounds only; see `getBoundedPosition`.
 *
 * @param props            - visx `Tooltip` props.
 * @param props.left       - Anchor x, in wrapper coordinates.
 * @param props.top        - Anchor y, in wrapper coordinates.
 * @param props.offsetLeft - Gap between the anchor and the box, horizontally.
 * @param props.offsetTop  - Gap between the anchor and the box, vertically.
 * @param props.style      - Box styles; visx's defaults unless `unstyled`.
 * @param props.unstyled   - Skip `style` and leave the box bare.
 * @param props.children   - Box content.
 * @param props.placement  - Fixed below-axis placement or automatic flipping.
 * @return The tooltip box.
 */
export const BoundedTooltip = ( {
	left = 0,
	top = 0,
	offsetLeft = DEFAULT_OFFSET,
	offsetTop = DEFAULT_OFFSET,
	style = defaultStyles,
	unstyled = false,
	children,
	placement = 'auto',
	...rest
}: BoundedTooltipProps ) => {
	const nodeRef = useRef< HTMLDivElement >( null );
	const clipRef = useRef< { wrapper: Element; clip: Element | null } | null >( null );
	const [ position, setPosition ] = useState< { x: number; y: number } | null >( null );

	useLayoutEffect( () => {
		const node = nodeRef.current;
		const wrapper = node?.parentElement;
		if ( ! node || ! wrapper ) {
			return;
		}
		if ( clipRef.current?.wrapper !== wrapper ) {
			clipRef.current = { wrapper, clip: findClippingAncestor( wrapper ) };
		}
		const own = node.getBoundingClientRect();
		const wrapperRect = wrapper.getBoundingClientRect();
		const clipRect = clipRef.current.clip?.getBoundingClientRect() ?? {
			left: 0,
			top: 0,
			right: window.innerWidth,
			bottom: window.innerHeight,
		};
		const next = getBoundedPosition( {
			left,
			top,
			offsetLeft,
			offsetTop,
			placement,
			box: { width: own.width, height: own.height },
			bounds: {
				left: clipRect.left - wrapperRect.left,
				top: clipRect.top - wrapperRect.top,
				right: clipRect.right - wrapperRect.left,
				bottom: clipRect.bottom - wrapperRect.top,
			},
		} );
		setPosition( current =>
			current && current.x === next.x && current.y === next.y ? current : next
		);
		// `children` re-runs the measurement when the content, and so the box size, changes.
	}, [ left, top, offsetLeft, offsetTop, children, placement ] );

	const x = position?.x ?? left + offsetLeft;
	const y = position?.y ?? top + ( placement === 'below-axis' ? POINTER_HEIGHT : offsetTop );

	return (
		<Tooltip
			ref={ nodeRef }
			data-testid="bounded-tooltip"
			style={ {
				position: 'absolute',
				left: 0,
				top: 0,
				transform: `translate(${ x }px, ${ y }px)`,
				...( ! unstyled && style ),
			} }
			{ ...rest }
		>
			{ placement === 'below-axis' && (
				<span
					aria-hidden="true"
					data-testid="tooltip-axis-pointer"
					style={ {
						position: 'absolute',
						left: left - x - POINTER_HEIGHT,
						top: -POINTER_HEIGHT,
						width: POINTER_HEIGHT * 2,
						height: POINTER_HEIGHT,
						background: 'inherit',
						clipPath: 'polygon(50% 0, 100% 100%, 0 100%)',
						pointerEvents: 'none',
					} }
				/>
			) }
			{ children }
		</Tooltip>
	);
};
