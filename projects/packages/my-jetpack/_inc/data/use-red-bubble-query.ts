import { QUERY_RED_BUBBLE_ALERTS_KEY, REST_API_RED_BUBBLE_ALERTS } from './constants';
import useSimpleQuery from './use-simple-query';

const useRedBubbleQuery = () => {
	const dismissalCookies = document.cookie
		.split( ';' )
		.map( cookie => cookie.trim() )
		.filter( cookie => cookie.includes( '_dismissed' ) );

	const {
		data = {} as RedBubbleAlerts,
		isLoading,
		isError,
		refetch,
	} = useSimpleQuery< RedBubbleAlerts >( {
		name: QUERY_RED_BUBBLE_ALERTS_KEY,
		query: {
			path: REST_API_RED_BUBBLE_ALERTS,
			method: 'POST',
			data: { dismissal_cookies: dismissalCookies },
		},
	} );

	return {
		data,
		isLoading,
		isError,
		refetch,
	};
};

export default useRedBubbleQuery;
