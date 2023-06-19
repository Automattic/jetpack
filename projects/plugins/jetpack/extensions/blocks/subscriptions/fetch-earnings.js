import apiFetch from '@wordpress/api-fetch';

const fetchSiteEarnings = async siteId => {
	try {
		const result = await apiFetch( {
			path: `wpcom/v2/sites/${ siteId }/memberships/earnings`,
			method: 'GET',
		} );
		return result;
	} catch ( error ) {
		return Promise.reject( error.message );
	}
};

export default fetchSiteEarnings;
