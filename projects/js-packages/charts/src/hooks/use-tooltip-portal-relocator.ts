import { useEffect } from 'react';
import type { RefObject } from 'react';

/**
 * Detects whether a DOM node is a visx chart tooltip portal.
 *
 * visx renders tooltips via `ReactDOM.createPortal` into plain `<div>` elements
 * appended to `document.body`. These portals have no id or className and contain
 * a child element with the class `visx-tooltip`.
 * @param node - The DOM node to check.
 * @return Whether the node is a visx tooltip portal div.
 */
function isVisxPortalNode( node: Node ): node is HTMLDivElement {
	return (
		node instanceof HTMLDivElement &&
		node.parentElement === document.body &&
		! node.id &&
		! node.className &&
		node.querySelector( '.visx-tooltip' ) !== null
	);
}

// Shared state for the document.body.removeChild patch.
// Reference-counted so multiple hook instances can coexist safely.
let patchRefCount = 0;
let origRemoveChild: typeof document.body.removeChild | null = null;
let patchedRemoveChild: typeof document.body.removeChild | null = null;
const relocatedNodes = new WeakSet< Node >();

/**
 * Installs (or increments the ref count of) the shared removeChild patch.
 */
function installRemoveChildPatch() {
	if ( patchRefCount++ > 0 ) {
		return;
	}
	origRemoveChild = document.body.removeChild;
	patchedRemoveChild = function < T extends Node >( this: HTMLElement, child: T ): T {
		if ( relocatedNodes.has( child ) && child.parentNode !== this ) {
			relocatedNodes.delete( child );
			child.parentNode?.removeChild( child );
			return child;
		}
		return origRemoveChild!.call( this, child );
	};
	document.body.removeChild = patchedRemoveChild;
}

/**
 * Decrements the ref count and removes the patch when no instances remain.
 * If another library has since wrapped our patch, we leave it in place to
 * avoid breaking their chain — our function becomes a transparent pass-through
 * once all relocated nodes have been cleaned up.
 */
function uninstallRemoveChildPatch() {
	if ( --patchRefCount > 0 ) {
		return;
	}
	// Only revert if removeChild is still our function. If something else
	// has wrapped it, reverting would break their patch.
	if ( document.body.removeChild === patchedRemoveChild ) {
		document.body.removeChild = origRemoveChild!;
	}
	origRemoveChild = null;
	patchedRemoveChild = null;
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
 * **Important:** The container and its ancestors must not have CSS `transform`,
 * `perspective`, or `filter` properties set, as these create a new containing
 * block for `position: fixed` children, breaking viewport-relative positioning.
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

		// Track nodes relocated by this instance so we can move them back on cleanup.
		const instanceNodes = new Set< Node >();

		const relocateNode = ( node: Node ) => {
			if ( ! isVisxPortalNode( node ) ) {
				return;
			}

			// Position the portal at the viewport origin so visx's
			// absolute-positioned tooltip coordinates remain correct.
			// Zero-size with overflow: visible so it doesn't affect layout
			// but tooltip content still renders. pointerEvents: none on the
			// wrapper is intentional — tooltip inner elements manage their own.
			Object.assign( node.style, {
				position: 'fixed',
				top: '0',
				left: '0',
				width: '0',
				height: '0',
				overflow: 'visible',
				zIndex: '1',
				pointerEvents: 'none',
			} );

			// Remember the focused element before moving the node — relocating
			// a DOM subtree causes the browser to blur any focused descendants.
			const { activeElement } = node.ownerDocument;
			const focusedElement =
				activeElement instanceof HTMLElement && node.contains( activeElement )
					? activeElement
					: null;

			// Insert at the start of the container (before header and content).
			container.insertBefore( node, container.firstChild );
			relocatedNodes.add( node );
			instanceNodes.add( node );

			// Restore focus that was lost due to the DOM move.
			if ( focusedElement ) {
				focusedElement.focus();
			}
		};

		// Patch document.body.removeChild so visx Portal unmount doesn't throw
		// when it tries to remove a node we already moved out of body.
		installRemoveChildPatch();

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
			// Disconnect first to avoid the observer re-relocating nodes
			// as we move them back to body.
			observer.disconnect();

			// Move relocated nodes back to body so visx can clean them up
			// normally with the original removeChild.
			for ( const node of instanceNodes ) {
				if ( node.parentNode === container ) {
					document.body.appendChild( node );
				}
				relocatedNodes.delete( node );
			}
			instanceNodes.clear();

			uninstallRemoveChildPatch();
		};
	}, [ containerRef ] );
}
