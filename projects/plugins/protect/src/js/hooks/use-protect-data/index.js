/**
 * External dependencies
 */
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { STORE_ID } from '../../state/store';

/**
 * Merges the list of installed extensions with the list of extensions that were checked for known vulnerabilities and return a normalized list to be used in the UI
 *
 * @param {object} installed - The list of installed extensions, where each attribute key is the extension slug.
 * @param {object} checked   - The list of checked extensions.
 * @returns {Array} Normalized list of extensions.
 */
function mergeInstalledAndCheckedLists( installed, checked ) {
	const newList = [];
	for ( const slug in installed ) {
		if ( checked.hasOwnProperty( slug ) ) {
			newList.push( {
				name: installed[ slug ].Name,
				version: checked[ slug ].version,
				vulnerabilities: checked[ slug ].vulnerabilities,
				notChecked: false,
			} );
		} else {
			newList.push( {
				name: installed[ slug ].Name,
				version: installed[ slug ].Version,
				vulnerabilities: [],
				notChecked: true,
			} );
		}
	}
	return newList;
}

/**
 * Get parsed data from the initial state
 *
 * @returns {object} The information available in Protect's initial state.
 */
export default function useProtectData() {
	const { installedPlugins, installedThemes, wpVersion, statusIsFetching, status } = useSelect(
		select => ( {
			installedPlugins: select( STORE_ID ).getInstalledPlugins(),
			installedThemes: select( STORE_ID ).getInstalledThemes(),
			wpVersion: select( STORE_ID ).getWpVersion(),
			statusIsFetching: select( STORE_ID ).getStatusIsFetching(),
			status: select( STORE_ID ).getStatus(),
		} )
	);

	const plugins = mergeInstalledAndCheckedLists( installedPlugins, status.plugins || {} );
	const themes = mergeInstalledAndCheckedLists( installedThemes, status.themes || {} );

	// Let's check if the WordPress version that was checked matches the current installed version.
	let core;
	if ( wpVersion && status.wordpress && status.wordpress.version === wpVersion ) {
		core = status.wordpress;
		core.name = 'wp';
	} else {
		core = {
			version: wpVersion,
			vulnerabilities: [],
			name: 'wp',
		};
	}

	let currentStatus = 'error';
	if ( statusIsFetching ) {
		currentStatus = 'loading';
	} else if ( status.status ) {
		currentStatus = status.status;
	}

	return {
		numVulnerabilities: status.numVulnerabilities || 0,
		numPluginsVulnerabilities: status.numPluginsVulnerabilities || 0,
		numThemesVulnerabilities: status.numThemesVulnerabilities || 0,
		lastChecked: status.lastChecked || null,
		core,
		plugins,
		themes,
		currentStatus,
	};
}
