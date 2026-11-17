import apiFetch from '@wordpress/api-fetch';

export const FETCH_JETPACK_MODULES = 'FETCH_JETPACK_MODULES';
export const UPDATE_JETPACK_MODULE_STATUS = 'UPDATE_JETPACK_MODULE_STATUS';

const MODULES_RETRY_DELAYS = [ 1000, 2000 ];

/**
 * Whether a failed modules request was a 429 or a reply that is not JSON.
 *
 * Atomic sends its 429 without a JSON body, and apiFetch reports any such reply only as invalid JSON,
 * with no status. So an HTML error page or a 503 is retried too; JSON errors such as a 403 are not.
 *
 * @param {object} error - The error apiFetch rejected with.
 * @return {boolean} Whether to retry.
 */
const isRateLimitedOrUnreadable = error =>
	error?.data?.status === 429 || error?.code === 'invalid_json';

/**
 * fetchJetpackModules action
 *
 * @return {object} - an action object.
 */
export const fetchJetpackModules = () => {
	return {
		type: FETCH_JETPACK_MODULES,
	};
};

/**
 * Updating single module status action
 *
 * @param           settings        - Jetpack module settings.
 * @param {string}  settings.name   - Jetpack module name.
 * @param {boolean} settings.active - If the module is active or not.
 */

export const updateJetpackModuleStatus = settings => {
	return {
		type: UPDATE_JETPACK_MODULE_STATUS,
		settings,
	};
};

export default {
	[ FETCH_JETPACK_MODULES ]: async function () {
		for ( let attempt = 0; ; attempt++ ) {
			try {
				return await apiFetch( {
					path: `/jetpack/v4/module/all`,
					method: 'GET',
				} );
			} catch ( error ) {
				if ( attempt >= MODULES_RETRY_DELAYS.length || ! isRateLimitedOrUnreadable( error ) ) {
					throw error;
				}
				await new Promise( resolve => setTimeout( resolve, MODULES_RETRY_DELAYS[ attempt ] ) );
			}
		}
	},
	[ UPDATE_JETPACK_MODULE_STATUS ]: function ( { settings } ) {
		return apiFetch( {
			path: `/jetpack/v4/module/${ settings.name }/active`,
			method: 'POST',
			data: {
				active: settings.active,
			},
		} );
	},
};
