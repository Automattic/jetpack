import restApi from '@automattic/jetpack-api';
import {
	JETPACK_SITE_DATA_FETCH,
	JETPACK_SITE_DATA_FETCH_RECEIVE,
	JETPACK_SITE_DATA_FETCH_FAIL,
	JETPACK_SITE_FEATURES_FETCH,
	JETPACK_SITE_FEATURES_FETCH_RECEIVE,
	JETPACK_SITE_FEATURES_FETCH_FAIL,
	JETPACK_SITE_BENEFITS_FETCH,
	JETPACK_SITE_BENEFITS_FETCH_RECEIVE,
	JETPACK_SITE_BENEFITS_FETCH_FAIL,
	JETPACK_SITE_DISCOUNT_FETCH,
	JETPACK_SITE_DISCOUNT_FETCH_RECEIVE,
	JETPACK_SITE_DISCOUNT_FETCH_FAIL,
	JETPACK_SITE_PLANS_FETCH,
	JETPACK_SITE_PLANS_FETCH_RECEIVE,
	JETPACK_SITE_PLANS_FETCH_FAIL,
	JETPACK_SITE_PURCHASES_FETCH,
	JETPACK_SITE_PURCHASES_FETCH_RECEIVE,
	JETPACK_SITE_PURCHASES_FETCH_FAIL,
	JETPACK_SITE_CONNECTED_PLUGINS_FETCH,
	JETPACK_SITE_CONNECTED_PLUGINS_FETCH_RECEIVE,
	JETPACK_SITE_CONNECTED_PLUGINS_FETCH_FAIL,
} from 'state/action-types';

export const fetchSiteData = () => {
	return dispatch => {
		dispatch( {
			type: JETPACK_SITE_DATA_FETCH,
		} );
		return restApi
			.fetchSiteData()
			.then( siteData => {
				dispatch( {
					type: JETPACK_SITE_DATA_FETCH_RECEIVE,
					siteData: siteData,
				} );
				return siteData;
			} )
			.catch( error => {
				dispatch( {
					type: JETPACK_SITE_DATA_FETCH_FAIL,
					error: error,
				} );
			} );
	};
};

export const fetchSiteBenefits = () => {
	return dispatch => {
		dispatch( {
			type: JETPACK_SITE_BENEFITS_FETCH,
		} );
		return restApi
			.fetchSiteBenefits()
			.then( siteBenefits => {
				dispatch( {
					type: JETPACK_SITE_BENEFITS_FETCH_RECEIVE,
					siteBenefits: siteBenefits,
				} );
			} )
			.catch( error => {
				dispatch( {
					type: JETPACK_SITE_BENEFITS_FETCH_FAIL,
					error: error,
				} );
			} );
	};
};

export const fetchSiteDiscount = () => {
	return dispatch => {
		dispatch( {
			type: JETPACK_SITE_DISCOUNT_FETCH,
		} );
		return restApi
			.fetchSiteDiscount()
			.then( siteDiscount => {
				dispatch( {
					type: JETPACK_SITE_DISCOUNT_FETCH_RECEIVE,
					siteDiscount,
				} );
			} )
			.catch( error => {
				dispatch( {
					type: JETPACK_SITE_DISCOUNT_FETCH_FAIL,
					error: error,
				} );
			} );
	};
};

export const fetchSiteFeatures = () => {
	return dispatch => {
		dispatch( {
			type: JETPACK_SITE_FEATURES_FETCH,
		} );
		return restApi
			.fetchSiteFeatures()
			.then( siteFeatures => {
				dispatch( {
					type: JETPACK_SITE_FEATURES_FETCH_RECEIVE,
					siteFeatures: siteFeatures,
				} );
				return siteFeatures;
			} )
			.catch( error => {
				dispatch( {
					type: JETPACK_SITE_FEATURES_FETCH_FAIL,
					error: error,
				} );
			} );
	};
};

export const fetchAvailablePlans = () => {
	return dispatch => {
		dispatch( {
			type: JETPACK_SITE_PLANS_FETCH,
		} );
		return restApi
			.getPlans()
			.then( sitePlans => {
				dispatch( {
					type: JETPACK_SITE_PLANS_FETCH_RECEIVE,
					plans: sitePlans,
				} );
				return sitePlans;
			} )
			.catch( error => {
				dispatch( {
					type: JETPACK_SITE_PLANS_FETCH_FAIL,
					error: error,
				} );
			} );
	};
};

export const fetchSitePurchases = () => {
	return dispatch => {
		dispatch( {
			type: JETPACK_SITE_PURCHASES_FETCH,
		} );
		return restApi
			.fetchSitePurchases()
			.then( purchases => {
				dispatch( {
					type: JETPACK_SITE_PURCHASES_FETCH_RECEIVE,
					purchases,
				} );
				return purchases;
			} )
			.catch( error => {
				dispatch( {
					type: JETPACK_SITE_PURCHASES_FETCH_FAIL,
					error,
				} );
			} );
	};
};

export const fetchConnectedPlugins = () => {
	return dispatch => {
		dispatch( {
			type: JETPACK_SITE_CONNECTED_PLUGINS_FETCH,
		} );
		return restApi
			.fetchConnectedPlugins()
			.then( connectedPlugins => {
				dispatch( {
					type: JETPACK_SITE_CONNECTED_PLUGINS_FETCH_RECEIVE,
					connectedPlugins: connectedPlugins,
				} );
				return connectedPlugins;
			} )
			.catch( error => {
				dispatch( {
					type: JETPACK_SITE_CONNECTED_PLUGINS_FETCH_FAIL,
					error: error,
				} );
			} );
	};
};
