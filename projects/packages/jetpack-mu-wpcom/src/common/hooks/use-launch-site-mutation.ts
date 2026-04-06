import { getSiteData } from '@automattic/jetpack-script-data';
import { useMutation } from '@tanstack/react-query';
import apiFetch from '@wordpress/api-fetch';
import wpcomRequest, { canAccessWpcomApis } from 'wpcom-proxy-request';

const useLaunchSiteMutation = ( onSuccess: () => void ) => {
	const siteData = getSiteData();

	return useMutation( {
		mutationFn: () => {
			if ( canAccessWpcomApis() ) {
				return wpcomRequest( {
					path: `/sites/${ siteData.wpcom.blog_id }/launch`,
					apiVersion: '1.1',
					method: 'POST',
				} );
			}
			return apiFetch( {
				path: '/wpcom/v2/launch-site',
				method: 'POST',
			} );
		},
		onSuccess,
	} );
};

export default useLaunchSiteMutation;
