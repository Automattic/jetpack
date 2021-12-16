/**
 * Internal dependencies
 */
import { SERVER_OBJECT_NAME } from '../../lib/constants';

/**
 * Reducer for storing server-generated values in the Redux store.
 *
 * @param {object} state - Current state.
 * @returns {object} Updated state.
 */
export function serverOptions( state = window[ SERVER_OBJECT_NAME ] ?? {} ) {
	return state;
}
