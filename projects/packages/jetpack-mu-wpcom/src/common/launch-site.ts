import apiFetch from '@wordpress/api-fetch';
import wpcomRequest, { canAccessWpcomApis } from 'wpcom-proxy-request';

/**
 * Launch a site asynchronously.
 * Uses wpcomRequest for WoA sites or apiFetch for Atomic sites.
 *
 * @param {number} blogId - The blog ID to launch
 * @return {Promise} Resolves when site is launched
 */
const launchSite = ( blogId: number ) => {
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
};

export default launchSite;
