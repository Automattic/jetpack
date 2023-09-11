import apiFetch from '@wordpress/api-fetch';

const fetchDefaultProducts = async currency => {
	try {
		const result = await apiFetch( {
			path: '/wpcom/v2/memberships/products',
			method: 'POST',
			data: {
				type: 'donation',
				currency,
				is_editable: false,
			},
		} );
		return result;
	} catch ( error ) {
		return Promise.reject( error.message );
	}
};

export default fetchDefaultProducts;
