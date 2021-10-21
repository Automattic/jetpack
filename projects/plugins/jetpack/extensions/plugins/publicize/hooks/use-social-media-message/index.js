/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';

export default function useSocialMediaMessage() {
	const { editPost } = useDispatch( editorStore );

	const { message, maxLength } = useSelect(
		select => ( {
			message: select( 'jetpack/publicize' ).getShareMessage(),
			maxLength: select( 'jetpack/publicize' ).getShareMessageMaxLength(),
		} ),
		[]
	);

	return {
		message,
		maxLength,
		updateMessage: function ( text, hasEdited = true ) {
			editPost( {
				meta: {
					jetpack_publicize_message: text,
					jetpack_publicize_hasEditedShareMessage: hasEdited,
				},
			} );
		},
	};
}
