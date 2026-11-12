import { useEffect, type RefObject } from 'react';
import {
	DEFAULT_OFFSET,
	findClippingAncestor,
	getBoundedPosition,
} from '../../../components/tooltip/private/bounded-tooltip';

const TOOLTIP_CLASS = 'google-visualization-tooltip';

const isTooltip = ( node: Node ): node is HTMLElement =>
	node instanceof HTMLElement && node.classList.contains( TOOLTIP_CLASS );

/**
 * Moves Google's HTML tooltip to where the other chart tooltips sit, just off the cursor. Google places it about 30px away and has no option for it.
 *
 * @param containerRef - The element Google draws the chart into.
 */
export function useTooltipPosition( containerRef: RefObject< HTMLElement > ) {
	useEffect( () => {
		const container = containerRef.current;

		if ( ! container || typeof MutationObserver === 'undefined' ) {
			return undefined;
		}

		let pointer: { x: number; y: number } | null = null;
		let clip: { parent: Element; element: Element | null } | null = null;
		const ownStyles = new WeakMap< HTMLElement, string >();

		const place = ( tooltip: HTMLElement ) => {
			const parent = tooltip.offsetParent;

			if ( ! pointer || ! parent ) {
				return;
			}

			if ( clip?.parent !== parent ) {
				clip = { parent, element: findClippingAncestor( parent ) };
			}

			const parentRect = parent.getBoundingClientRect();
			const clipRect = clip.element?.getBoundingClientRect() ?? {
				left: 0,
				top: 0,
				right: window.innerWidth,
				bottom: window.innerHeight,
			};
			const { x, y } = getBoundedPosition( {
				left: pointer.x - parentRect.left,
				top: pointer.y - parentRect.top,
				offsetLeft: DEFAULT_OFFSET,
				offsetTop: DEFAULT_OFFSET,
				box: { width: tooltip.offsetWidth, height: tooltip.offsetHeight },
				wrapper: { left: 0, top: 0, right: parentRect.width, bottom: parentRect.height },
				bounds: {
					left: clipRect.left - parentRect.left,
					top: clipRect.top - parentRect.top,
					right: clipRect.right - parentRect.left,
					bottom: clipRect.bottom - parentRect.top,
				},
			} );

			tooltip.style.left = `${ x }px`;
			tooltip.style.top = `${ y }px`;
			ownStyles.set( tooltip, tooltip.style.cssText );
		};

		const trackPointer = ( event: MouseEvent ) => {
			pointer = { x: event.clientX, y: event.clientY };
		};

		const observer = new MutationObserver( records => {
			const tooltips = new Set< HTMLElement >();

			for ( const record of records ) {
				if ( isTooltip( record.target ) ) {
					tooltips.add( record.target );
				}
				record.addedNodes.forEach( node => isTooltip( node ) && tooltips.add( node ) );
			}

			for ( const tooltip of tooltips ) {
				// Our own write is observed too; placing again would loop.
				if ( ownStyles.get( tooltip ) !== tooltip.style.cssText ) {
					place( tooltip );
				}
			}
		} );

		// Google's own mouse events, captured so the pointer is current before Google writes the tooltip. Chrome sends mouse events, but no pointer events, when the map moves under a resting cursor.
		container.addEventListener( 'mouseover', trackPointer, true );
		container.addEventListener( 'mousemove', trackPointer, true );
		observer.observe( container, {
			childList: true,
			subtree: true,
			attributes: true,
			attributeFilter: [ 'style' ],
		} );

		return () => {
			container.removeEventListener( 'mouseover', trackPointer, true );
			container.removeEventListener( 'mousemove', trackPointer, true );
			observer.disconnect();
		};
	}, [ containerRef ] );
}
