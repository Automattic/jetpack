export const QUERY_SITE_PLANS = 'QUERY_SITE_PLANS';

const sitePlanActions = {
	querySitePlans: options => ( {
		type: 'QUERY_SITE_PLANS',
		options,
	} ),
};

export default sitePlanActions;
