/**
 * Internal dependencies
 */
import actions from './actions';

const connectionResolvers = {
	*getConnectionStatus() {
		yield actions.setConnectionStatusIsFetching( true );
		const result = yield actions.fetchConnectionStatus();
		yield actions.setConnectionStatusIsFetching( false );
		return actions.setConnectionStatus( result );
	},
	getAuthorizationUrl: {
		isFulfilled: state => {
			return Boolean( state.authorizationUrl );
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
