import { JETPACK_SEARCH_TERM } from 'state/action-types';

export const filterSearch = term => {
	return dispatch => {
		dispatch( {
			type: JETPACK_SEARCH_TERM,
			term: term,
		} );
	};
};
