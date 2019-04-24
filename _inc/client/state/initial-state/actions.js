/**
 * Internal dependencies
 */
import { JETPACK_SET_INITIAL_STATE } from 'state/action-types';

export const setInitialState = initialState => ( {
	type: JETPACK_SET_INITIAL_STATE,
	initialState,
} );
