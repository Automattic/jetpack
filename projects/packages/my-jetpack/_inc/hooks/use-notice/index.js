import { useSelect, useDispatch } from '@wordpress/data';
import { STORE_ID } from '../../state/store';

/**
 * React custom hook to get global notices.
 *
 * @returns {object} Global notices data
 */
export default function useGlobalNotice() {
	const dispatch = useDispatch();

	const { message, options } = useSelect( select => select( STORE_ID ).getGlobalNotice() );
	return {
		message,
		options: options || {},
		clean: () => dispatch( STORE_ID ).cleanGlobalNotice(),
	};
}
