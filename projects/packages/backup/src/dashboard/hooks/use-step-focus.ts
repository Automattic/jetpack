import { useCallback, useEffect, useRef } from '@wordpress/element';

/**
 * Moves focus to each new step's heading once a click on the screen has started the change.
 *
 * Before that click it does nothing, so a cold load or a deep link keeps its focus; after it,
 * it moves only focus the step change dropped to the body, never focus the reader placed.
 *
 * @param step - What the screen is showing; focus is reconsidered whenever it changes.
 * @return A callback ref for the step's heading (a form's is the card's), and `arm` for clicks.
 */
export function useStepFocus( step: string ) {
	const heading = useRef< HTMLElement | null >( null );
	const armed = useRef( false );

	useEffect( () => {
		const node = heading.current;
		const active = node?.ownerDocument.activeElement;
		if ( armed.current && node && ( ! active || active === node.ownerDocument.body ) ) {
			node.focus();
		}
	}, [ step ] );

	const ref = useCallback( ( node: HTMLElement | null ) => {
		heading.current = node;
	}, [] );
	const arm = useCallback( () => {
		armed.current = true;
	}, [] );

	return { ref, arm };
}
