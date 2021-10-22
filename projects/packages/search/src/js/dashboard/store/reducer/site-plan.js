/**
 * Internal dependencies
 */
import restApi from '@automattic/jetpack-api';
import { QUERY_SITE_PLANS } from '../actions/site-plan';
3;

const sitePlans = async ( state = {}, action ) => {
	switch ( action.type ) {
		case QUERY_SITE_PLANS:
			try {
				state.sitePlan = {
					hasBusinessPlan: true,
					hasActiveSearchPurchase: true,
					supportsInstantSearch: true,
					plans: [],
				};
				// state.sitePlans = await restApi.fetchSitePurchases();
				// console.log(stae.sitePlans)
			} catch ( e ) {
				//dispatch an error
			}
			return state;
	}

	return state;
};

export default sitePlans;
