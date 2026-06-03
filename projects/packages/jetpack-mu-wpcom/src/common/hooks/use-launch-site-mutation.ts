import { useMutation } from '@tanstack/react-query';
import apiFetch from '@wordpress/api-fetch';
import wpcomRequest, { canAccessWpcomApis } from 'wpcom-proxy-request';

const useLaunchSiteMutation = ( blogId: number, onSuccess: () => void ) => {
	return useMutation( {
		mutationFn: () => {
			if ( canAccessWpcomApis() ) {
				return wpcomRequest( {
					path: `/sites/${ blogId }/launch`,
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
