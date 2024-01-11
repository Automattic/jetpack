import apiFetch from '@wordpress/api-fetch';

export const FETCH_JETPACK_MODULES = 'FETCH_JETPACK_MODULES';
export const UPDATE_JETPACK_MODULE_STATUS = 'UPDATE_JETPACK_MODULE_STATUS';

/**
 * fetchJetpackModules action
 *
 * @returns {object} - an action object.
 */
export const fetchJetpackModules = () => {
	return {
		type: FETCH_JETPACK_MODULES,
	};
};

/**
 * Updating single module status action
 *
 * @param settings - Jetpack module settings.
 * @param {string} settings.name - Jetpack module name.
 * @param {boolean} settings.active - If the module is active or not.
 */

export const updateJetpackModuleStatus = settings => {
	return {
		type: UPDATE_JETPACK_MODULE_STATUS,
		settings,
	};
};

export default {
	[ FETCH_JETPACK_MODULES ]: function () {
		return apiFetch( {
			path: `/jetpack/v4/module/all`,
			method: 'GET',
		} );
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
