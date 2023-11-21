import { useDispatch } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { getShareMessage, getShareMessageMaxLength } from '../../utils';

/**
 * @typedef {object} MessageHook
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

	return {
		message: getShareMessage(),
		maxLength: getShareMessageMaxLength(),
		updateMessage: function ( text ) {
			editPost( {
				meta: {
					jetpack_publicize_message: text,
				},
			} );
		},
	};
}
