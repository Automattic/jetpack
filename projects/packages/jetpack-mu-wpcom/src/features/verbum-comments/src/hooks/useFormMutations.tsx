import { useEffect, useContext } from 'preact/hooks';
import { VerbumSignals } from '../state';

/**
 * Hook to observe comment form changes and update state according to comment_parent changes.
 *
 * @param formElement - The form element to observe.
 */
export default function useFormMutations( formElement: HTMLFormElement ) {
	const { commentParent } = useContext( VerbumSignals );

	useEffect( () => {
		const commentParentInput = formElement.querySelector( '#comment_parent' );

		if ( ! formElement || ! commentParentInput ) {
			return;
		}

		commentParent.value = Number( commentParentInput.getAttribute( 'value' ) );

		const mutationObserver = new MutationObserver( mutations => {
			mutations.forEach( mutation => {
				if ( mutation.type === 'attributes' && mutation.target === commentParentInput ) {
					commentParent.value = Number( commentParentInput.getAttribute( 'value' ) );
				}
			} );
		} );

		mutationObserver.observe( formElement, { attributes: true, subtree: true } );

		return () => {
			mutationObserver.disconnect();
		};
	}, [ formElement, commentParent ] );
}
