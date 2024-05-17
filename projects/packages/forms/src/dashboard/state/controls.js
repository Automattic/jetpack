/**
 * Internal dependencies
 */
import { ASYNC_ROUTINE_DISPATCH } from './action-types';

export default {
	[ ASYNC_ROUTINE_DISPATCH ]: ( { apply, args } ) => {
		return apply( ...args );
	},
};
