import { useEffect } from 'preact/hooks';
import { commentParent } from '../state';

/**
 * Hook to observe comment form changes and update state according to comment_parent changes.
 */
export default function useFormMutations() {
	useEffect( () => {
		const formElement = document.querySelector( '#commentform' ) as HTMLFormElement;
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
	}, [] );
}
