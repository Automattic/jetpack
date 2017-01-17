/**
 * Internal dependencies
 */
import {
	JETPACK_SEARCH_TERM,
	JETPACK_SEARCH_FOCUS,
	JETPACK_SEARCH_BLUR
} from 'state/action-types';

export const filterSearch = ( term ) => {
	return ( dispatch ) => {
		dispatch( {
			type: JETPACK_SEARCH_TERM,
			term: term
		} );
	}
};

export const focusSearch = ( hasFocus ) => {
	return ( dispatch ) => {
		if ( hasFocus ) {
			dispatch( {
				type: JETPACK_SEARCH_FOCUS
			} );
		} else {
			dispatch( {
				type: JETPACK_SEARCH_BLUR
			} );
		}
	}
};
