import { useSelect, useDispatch } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';

/**
 * @typedef {Object} MessageHook
 * @property {string} message - The text of the message.
 * @property {number} maxLength - The maximum length of the message.
 * @property {Function} updateMessage - Callback used to update the message.
 */

/**
 * Hook to handle storing the the current custom message.
 *
 * @returns {MessageHook} - An object with the message hook properties set.
 */
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
		updateMessage: function ( text ) {
			editPost( {
				meta: {
					jetpack_publicize_message: text,
				},
			} );
		},
	};
}
