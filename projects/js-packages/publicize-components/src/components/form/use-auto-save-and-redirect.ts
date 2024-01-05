import { useDispatch, useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { useCallback } from '@wordpress/element';

/**
 * Hook to handle autosaving and redirecting to a new page.
 * It can be used a click handler for links.
 *
 * @returns {Function} Function to handle autosaving and redirecting.
 */
export function useAutoSaveAndRedirect(): React.DOMAttributes< HTMLAnchorElement >[ 'onClick' ] {
	const { isEditedPostDirty } = useSelect( editorStore, [] );
	const { autosave } = useDispatch( editorStore );

	return useCallback(
		async event => {
			if ( ! ( event.target instanceof HTMLAnchorElement ) ) {
				return;
			}
			const target = event.target.getAttribute( 'target' );
			if ( isEditedPostDirty() && ! target ) {
				event.preventDefault();
				await autosave();
				window.location.href = event.target.href;
			}
			if ( target ) {
				event.preventDefault();
				window.open( event.target.href, target, 'noreferrer' );
			}
		},
		[ autosave, isEditedPostDirty ]
	);
}
