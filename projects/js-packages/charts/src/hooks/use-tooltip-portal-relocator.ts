import { useEffect } from 'react';
import type { RefObject } from 'react';

/**
 * Detects whether a DOM node is a visx chart tooltip portal.
 *
 * visx renders tooltips via `ReactDOM.createPortal` into plain `<div>` elements
 * appended to `document.body`. These portals have no id or className and contain
 * child elements with visx-specific classes (e.g. `.visx-tooltip-portal`).
 * @param node - The DOM node to check.
 * @return Whether the node is a visx tooltip portal div.
 */
function isVisxPortalNode( node: Node ): node is HTMLDivElement {
	return (
		node instanceof HTMLDivElement &&
		node.parentElement === document.body &&
		! node.id &&
		! node.className &&
		node.querySelector( '[class*="visx"]' ) !== null
	);
}

/**
 * Relocates visx chart tooltip portals from `document.body` into a target
 * container element. This allows the tooltips to participate in the same CSS
 * stacking context as other elements in the container (e.g. a sticky header),
 * so z-index ordering works correctly between them.
 *
 * The relocated portal divs use `position: fixed` at the viewport origin to
 * preserve the tooltip coordinate system (visx calculates positions relative
 * to the viewport).
 *
 * Because the visx Portal class calls `document.body.removeChild(node)` during
 * unmount, we patch `document.body.removeChild` to gracefully handle nodes that
 * were moved out of body. Without this, React throws a "not a child of this
 * node" error when tooltips unmount.
 *
 * @param containerRef - Ref to the element that portals should be relocated into.
 *                     The container should use `position: relative; z-index: 0`
 *                     to create a stacking context.
 */
export function useTooltipPortalRelocator(
	containerRef: RefObject< HTMLElement | null > | undefined
) {
	useEffect( () => {
		const container = containerRef?.current;
		if ( ! container ) {
			return;
		}

		// Track nodes we've relocated so we can intercept their removal.
		const relocatedNodes = new WeakSet< Node >();

		const relocateNode = ( node: Node ) => {
			if ( ! isVisxPortalNode( node ) ) {
				return;
			}
			// Position the portal at the viewport origin so visx's
			// absolute-positioned tooltip coordinates remain correct.
			node.style.position = 'fixed';
			node.style.top = '0';
			node.style.left = '0';
			node.style.width = '0';
			node.style.height = '0';
			node.style.overflow = 'visible';
			node.style.zIndex = '1';
			node.style.pointerEvents = 'none';

			// Insert at the start of the container (before header and content).
			container.insertBefore( node, container.firstChild );
			relocatedNodes.add( node );
		};

		// Patch document.body.removeChild so visx Portal unmount doesn't throw
		// when it tries to remove a node we already moved out of body.
		const origRemoveChild = document.body.removeChild;
		document.body.removeChild = function < T extends Node >( child: T ): T {
			if ( relocatedNodes.has( child ) && child.parentNode !== this ) {
				relocatedNodes.delete( child );
				child.parentNode?.removeChild( child );
				return child;
			}
			return origRemoveChild.call( this, child );
		};

		// Relocate any portals that already exist.
		for ( const child of Array.from( document.body.children ) ) {
			relocateNode( child );
		}

		// Watch for new portals being appended to body.
		const observer = new MutationObserver( mutations => {
			for ( const mutation of mutations ) {
				for ( const node of mutation.addedNodes ) {
					relocateNode( node );
				}
			}
		} );

		observer.observe( document.body, { childList: true } );

		return () => {
			observer.disconnect();
			document.body.removeChild = origRemoveChild;
		};
	}, [ containerRef ] );
}
