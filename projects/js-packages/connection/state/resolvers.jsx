/**
 * External dependencies
 */
import { select } from '@wordpress/data';

/**
 * Internal dependencies
 */
import actions from './actions';
import { STORE_ID } from './store';

const connectionResolvers = {
	*getConnectionStatus() {
		const existingStatus = select( STORE_ID ).getConnectionStatus();
		if ( existingStatus.hasOwnProperty( 'isRegistered' ) ) {
			return existingStatus;
		}
		yield actions.setConnectionStatusIsFetching( true );
		const result = yield actions.fetchConnectionStatus();
		yield actions.setConnectionStatusIsFetching( false );
		return actions.setConnectionStatus( result );
	},
};

export default {
	...connectionResolvers,
};
