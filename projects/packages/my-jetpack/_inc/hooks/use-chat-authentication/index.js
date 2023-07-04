import { useSelect } from '@wordpress/data';
import { STORE_ID } from '../../state/store';

/**
 * React custom hook to get the chat authentication jwt token
 *
 * @returns {object} chat authentication jwt token
 */
export default function useChatAuthentication() {
	const { jwt, isFetchingChatAuthentication } = useSelect( select => {
		const { getChatAuthentication, isRequestingChatAuthentication } = select( STORE_ID );

		return {
			jwt: getChatAuthentication(),
			isFetchingChatAuthentication: isRequestingChatAuthentication(),
		};
	} );

	return {
		jwt,
		isFetchingChatAuthentication,
	};
}
