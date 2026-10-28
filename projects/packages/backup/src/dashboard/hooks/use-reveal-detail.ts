import { useCallback, useEffect, useRef } from '@wordpress/element';
import type { RefObject } from 'react';

/**
 * Whether the Overview grid has one column, which puts the detail pane below the list.
 *
 * Read from the grid rather than a breakpoint, so it follows the stylesheet.
 *
 * @param overview - The two-pane grid.
 * @return True when the panes are stacked.
 */
function isStacked( overview: HTMLElement ): boolean {
	const columns =
		overview.ownerDocument.defaultView?.getComputedStyle( overview ).gridTemplateColumns ?? '';
	return /^\S+$/.test( columns ) && columns !== 'none';
}

/**
 * Scroll the detail pane to the top of the view and focus its heading.
 *
 * @param overview - The two-pane grid.
 */
function reveal( overview: HTMLElement ): void {
	const pane = overview.children[ 1 ];
	pane?.scrollIntoView( { block: 'start' } );
	pane?.querySelector< HTMLElement >( 'h2' )?.focus( { preventScroll: true } );
}

/**
 * Bring the detail pane into view after a row is chosen, when the panes are stacked.
 *
 * Below the desktop breakpoint the pane sits under the list, so a tap otherwise updates it out of
 * view with nothing to say so.
 *
 * @param overviewRef - The two-pane grid.
 * @param selectedId  - The row the pane shows.
 * @return A function to call with the chosen row's id before navigating to it.
 */
export function useRevealDetail(
	overviewRef: RefObject< HTMLElement | null >,
	selectedId: string | null
): ( id: string ) => void {
	const pending = useRef( false );

	// Runs once the pane has rendered the new row.
	useEffect( () => {
		if ( pending.current && overviewRef.current ) {
			reveal( overviewRef.current );
		}
		pending.current = false;
	}, [ overviewRef, selectedId ] );

	return useCallback(
		( id: string ) => {
			const overview = overviewRef.current;
			if ( ! overview || ! isStacked( overview ) ) {
				return;
			}
			// Already shown, so nothing re-renders to run the effect.
			if ( id === selectedId ) {
				reveal( overview );
			} else {
				pending.current = true;
			}
		},
		[ overviewRef, selectedId ]
	);
}
