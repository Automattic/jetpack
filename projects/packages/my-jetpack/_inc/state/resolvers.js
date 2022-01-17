/**
 * External dependencies
 */

/**
 * Internal dependencies
 */
import actions from './actions';

const myJetpackResolvers = {
	*getPurchases() {
		yield actions.setPurchasesIsFetching( true );
		const result = yield actions.fetchPurchases();
		yield actions.setPurchasesIsFetching( false );
		return actions.setPurchases( result );
	},
};

export default {
	...myJetpackResolvers,
};
