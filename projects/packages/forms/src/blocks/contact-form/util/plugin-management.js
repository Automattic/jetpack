import { isSimpleSite } from '@automattic/jetpack-shared-extension-utils';
import apiFetch from '@wordpress/api-fetch';

/**
 * Returns a list of all active plugins on the site.
 *
 * @returns {Promise} Resolves to a list of plugins, or reject if not retrievable (like on a wpcom simple site or a site running an older version of WP)
 */
export async function getPlugins() {
	// Bail early on WordPress.com Simple sites.
	if ( isSimpleSite() ) {
		return Promise.reject();
	}

	try {
		const plugins = await apiFetch( {
			path: '/jetpack/v4/plugins',
		} );
		return plugins;
	} catch ( error ) {
		return Promise.reject( error.message );
	}
}

/**
 * Install and activate a plugin from the WordPress.org plugin directory.
 *
 * @param {string} slug - The slug of the plugin we want to activate.
 * @returns {Promise} Resolves to true if the plugin has been successfully activated, or reject.
 */
export async function installAndActivatePlugin( slug ) {
	// Bail early on WordPress.com Simple sites.
	if ( isSimpleSite() ) {
		return Promise.reject();
	}

	try {
		const attemptInstall = await apiFetch( {
			path: '/jetpack/v4/plugins',
			method: 'POST',
			data: {
				slug,
				status: 'active',
				source: 'block-editor',
			},
		} );
		return attemptInstall;
	} catch ( error ) {
		return Promise.reject( error.message );
	}
}

/**
 * Activate a plugin from the WordPress.org plugin directory.
 *
 * @param {string} pluginFile - The plugin long slug (slug/index-file, without the .php suffix) we want to activate.
 * @returns {Promise} Resolves to true if the plugin has been successfully activated, or reject.
 */
export async function activatePlugin( pluginFile ) {
	// Bail early on WordPress.com Simple sites.
	if ( isSimpleSite() ) {
		return Promise.reject();
	}

	try {
		const attemptActivate = await apiFetch( {
			path: `/jetpack/v4/plugins/${ pluginFile }`,
			method: 'POST',
			data: {
				status: 'active',
				source: 'block-editor',
			},
		} );
		return attemptActivate;
	} catch ( error ) {
		return Promise.reject( error.message );
	}
}
