/**
 * External dependencies
 */
import { useSelect } from '@wordpress/data';
/**
 * Internal dependencies
 */
import { STORE_ID } from '../../../state/constants';

/**
 * React custom hook to get the Users.
 *
 * @returns {object} Users
 */
export default function useUsers() {
	// Data
	const users = useSelect( select => select( STORE_ID ).getUsers() );
	const pagination = useSelect( select => select( STORE_ID ).getUsersPagination() );

	return {
		users,
		...pagination,
	};
}
