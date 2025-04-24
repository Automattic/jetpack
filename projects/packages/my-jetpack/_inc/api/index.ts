/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';

/**
 * API wrapper.
 */
const api = {
	/**
	 * Update the WoA auto-reconnect setting.
	 *
	 * @param {boolean} enabled - Whether auto-reconnect is enabled.
	 * @return {Promise} - The API response.
	 */
	updateWoaAutoReconnect: ( enabled: boolean ) => {
		return apiFetch( {
			path: `my-jetpack/v1/site/woa-auto-reconnect`,
			method: 'POST',
			data: { enabled },
		} );
	},

	/**
	 * Try to reconnect the site.
	 *
	 * @return {Promise} - The API response.
	 */
	tryReconnect: () => {
		return apiFetch( {
			path: `my-jetpack/v1/site/try-reconnect`,
			method: 'POST',
		} );
	},
};

export default api;
