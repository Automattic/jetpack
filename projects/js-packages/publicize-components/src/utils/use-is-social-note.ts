import { useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';

/**
 * Whether the current post is a social note.
 *
 * @return {boolean} Whether the current post is a social note.
 */
export function useIsSocialNote() {
	return useSelect( select => {
		const currentPostType = select( editorStore ).getCurrentPostType();

		return 'jetpack-social-note' === currentPostType;
	}, [] );
}
