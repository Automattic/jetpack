import { dispatch, select } from '@wordpress/data';
import actions from './actions';
import STORE_ID from './store-id';

const connectionResolvers = {
	getAuthorizationUrl: {
		isFulfilled: ( state, ...args ) => {
			const hasAuthorization = Boolean( state.authorizationUrl );
			const hasFinishedResolution = select( STORE_ID ).hasFinishedResolution(
				'getAuthorizationUrl',
				args
			);

			// we need to set finish resolution to fix a problem when using resolveSelect,
			// since it looks for finishResolution to return the value
			// ref: https://github.com/WordPress/gutenberg/blob/5dbf7ca8a285f5cab65ebf7ab87dafeb6118b6aa/packages/data/src/redux-store/index.js#L342
			if ( hasAuthorization && ! hasFinishedResolution ) {
				dispatch( STORE_ID ).finishResolution( 'getAuthorizationUrl', args );
			}

			return hasAuthorization;
		},
		*fulfill( redirectUri ) {
			const response = yield actions.fetchAuthorizationUrl( redirectUri );
			yield actions.setAuthorizationUrl( response.authorizeUrl );
		},
	},
};

export default {
	...connectionResolvers,
};
