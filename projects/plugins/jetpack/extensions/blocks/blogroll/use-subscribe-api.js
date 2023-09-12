import apiFetch from '@wordpress/api-fetch';

const useSubscribeApi = () => {
	const subscribeToBlog = async siteId => {
		return await apiFetch( {
			path: `/wpcom/v2/blog-subscriptions/new?blog_id=${ siteId }`,
			global: true,
			method: 'POST',
		} );
	};

	return { subscribeToBlog };
};

export default useSubscribeApi;
