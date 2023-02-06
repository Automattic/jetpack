import restApi from '@automattic/jetpack-api';
import {
	JETPACK_INTRO_OFFERS_FETCH,
	JETPACK_INTRO_OFFERS_FETCH_RECEIVE,
	JETPACK_INTRO_OFFERS_FETCH_FAIL,
} from 'state/action-types';

export const fetchIntroOffers = () => {
	return dispatch => {
		dispatch( {
			type: JETPACK_INTRO_OFFERS_FETCH,
		} );
		return restApi
			.fetchIntroOffers()
			.then( ( { data } ) => {
				dispatch( {
					type: JETPACK_INTRO_OFFERS_FETCH_RECEIVE,
					data,
				} );
			} )
			.catch( error => {
				dispatch( {
					type: JETPACK_INTRO_OFFERS_FETCH_FAIL,
					error,
				} );
			} );
	};
};
