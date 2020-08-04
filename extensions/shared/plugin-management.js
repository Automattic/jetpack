/**
 * External dependencies
 */
import { noop } from 'lodash';

/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';

/**
 * Internal dependencies
 */
import { isSimpleSite } from './site-type-utils';

/**
 * Returns a list of all active plugins on the site.
 *
 * @param {Function} [setIsLoading=noop] - An optional function to track the resolving state. Typically used to update the calling component's state.
 *
 * @returns {Promise} Resolves to a list of plugins, or reject if not retrievable (like on a wpcom simple site or a site running an older version of WP)
 */
export async function getPlugins( setIsLoading = noop ) {
	setIsLoading( true );

	return new Promise( ( resolve, reject ) => {
		// Bail early on WordPress.com Simple sites.
		if ( isSimpleSite() ) {
			setIsLoading( false );
			reject();
		}

		// Fetch plugins.
		apiFetch( { path: '/jetpack/v4/plugins' } ).then(
			response => {
				setIsLoading( false );
				resolve( response );
			},
			() => {
				setIsLoading( false );
				reject();
			}
		);
	} );
}

/**
 * Install and activate a plugin from the WordPress.org plugin directory.
 *
 * @param {string} slug - The slug of the plugin we want to activate.
 * @param {Function} [setIsInstalling=noop] - An optional function to track the resolving state. Typically used to update the calling component's state.
 *
 * @returns {Promise} Resolves to true if the plugin has been successfully activate, or reject.
 */
export async function installAndActivatePlugin( slug, setIsInstalling = noop ) {
	setIsInstalling( true );

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
			},
		} );

		// If we could not install and the plugin was not already active, return the error.
		if ( 200 !== attemptInstall.data.status && 'folder_exists' !== attemptInstall.code ) {
			setIsInstalling( false );
			return Promise.reject( attemptInstall.message );
		}

		// not going to work when plugin is already installed.
		const { plugin: pluginLongSlug, status } = attemptInstall;

		if ( 'inactive' !== status ) {
			setIsInstalling( false );
			return Promise.reject( status );
		}

		// Try to activate.
		const attemptActivate = await apiFetch( {
			path: `/jetpack/v4/plugins/${ pluginLongSlug }`,
			method: 'PUT',
			data: {
				status: 'active',
			},
		} );

		setIsInstalling( false );
		return attemptActivate;
	} catch ( error ) {
		return Promise.reject( error.message );
	}
}
