import { autoUpdate } from '@floating-ui/react-dom';
import { debug } from '../utils';
import type { ReferenceType } from '@floating-ui/react-dom';

export interface LiveResizeConfiguration {
	/** CSS Selector for the the DOM node (and children) to observe for mutations */
	rootElementSelector?: string;
	/** True to enable update on reference element resize, defaults to false */
	resize?: boolean;
	/** True to enable update on node and subtree mutation, defaults to false. May be performance intensive */
	mutation?: boolean;
}

/**
 * Builds a `whileElementsMounted` callback for Floating UI's `useFloating` that keeps the floating
 * element positioned. It always wires up Floating UI's `autoUpdate` (which reacts to ancestor
 * scroll/resize), optionally observes the reference element's own resize, and optionally observes a
 * root element's subtree for mutations — queuing a position update whenever any of these fire.
 *
 * The reason for being a currying function is so that we can customise the root element selector,
 * otherwise observing at a higher than necessary level might cause unnecessary performance penalties.
 *
 * @param config                     - The live resize config.
 * @param config.rootElementSelector - The selector of the root element to observe for mutations.
 * @param config.mutation            - Whether to observe DOM mutations of the root element.
 * @param config.resize              - Whether to observe the reference element's resize.
 * @return A `whileElementsMounted` callback that returns a cleanup function.
 */
export const createLiveResizeAutoUpdate =
	(
		{ rootElementSelector, mutation = false, resize = false }: LiveResizeConfiguration = {
			mutation: false,
			resize: false,
		}
	) =>
	( reference: ReferenceType, floating: HTMLElement, update: () => void ) => {
		// Floating UI handles ancestor scroll/resize out of the box. Enabling `elementResize` adds a
		// ResizeObserver on the reference (and floating) elements, matching the previous `resize`
		// behaviour where Tour Kit repositioned on reference element resize.
		const cleanups: Array< () => void > = [
			autoUpdate( reference, floating, update, { elementResize: resize } ),
		];

		if ( mutation ) {
			const rootElementNode = document.querySelector( rootElementSelector || '#wpwrap' );
			if ( rootElementNode instanceof Element ) {
				const mutationObserver = new MutationObserver( () => update() );
				mutationObserver.observe( rootElementNode, {
					attributes: true,
					characterData: true,
					childList: true,
					subtree: true,
				} );
				cleanups.push( () => mutationObserver.disconnect() );
			} else {
				debug(
					`Error: ${ rootElementSelector } selector did not find a valid DOM element, Tour Kit will not update automatically if the DOM layout changes.`
				);
			}
		}

		return () => cleanups.forEach( cleanup => cleanup() );
	};
