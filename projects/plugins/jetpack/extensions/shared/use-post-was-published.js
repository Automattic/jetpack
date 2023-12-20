import { useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';

const usePostWasPublished = () => {
	const postWasEverPublished = useSelect( select => {
		const meta = select( editorStore ).getEditedPostAttribute( 'meta' );
		return ! meta?.jetpack_post_was_ever_published;
	} );

	return {
		postWasEverPublished,
	};
};

export default usePostWasPublished;
