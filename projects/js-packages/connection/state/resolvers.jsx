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
};

export default {
	...connectionResolvers,
};
