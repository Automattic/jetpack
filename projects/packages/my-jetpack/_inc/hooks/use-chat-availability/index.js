import { useSelect } from '@wordpress/data';
import { STORE_ID } from '../../state/store';

/**
 * React custom hook to get the chat availability data
 *
 * @returns {object} chat availability data
 */
export default function useChatAvailability() {
	const { isAvailable, isFetchingChatAvailability } = useSelect( select => {
		const { getChatAvailability, isRequestingChatAvailability } = select( STORE_ID );

		return {
			isAvailable: getChatAvailability(),
			isFetchingChatAvailability: isRequestingChatAvailability(),
		};
	} );

	return {
		isAvailable,
		isFetchingChatAvailability,
	};
}
