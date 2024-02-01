import { getShareMessageMaxLength } from '../../utils';
import { usePostMeta } from '../use-post-meta';

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
	const { updateMeta, shareMessage } = usePostMeta();

	return {
		message: shareMessage,
		maxLength: getShareMessageMaxLength(),
		updateMessage: function ( text ) {
			updateMeta( 'jetpack_publicize_message', text );
		},
	};
}
