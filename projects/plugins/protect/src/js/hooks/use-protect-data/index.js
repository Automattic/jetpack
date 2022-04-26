/**
 * External dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { useConnection } from '@automattic/jetpack-connection';

/**
 * Internal dependencies
 */
import { STORE_ID } from '../../state/store';
import { useEffect } from 'react';

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
		if ( checked.hasOwnProperty( slug ) && checked[ slug ].version === installed[ slug ].Version ) {
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
 * Check if the WordPress version that was checked matches the current installed version.
 *
 * @param {string} wpVersion - The current installed WP version.
 * @param {object} coreCheck - The object returned by Protect wpcom endpoint.
 * @returns {object} The object representing the current status of core checks.
 */
function normalizeCoreInformation( wpVersion, coreCheck ) {
	let core;
	if ( wpVersion && coreCheck && coreCheck.version === wpVersion ) {
		core = coreCheck;
		core.name = 'WordPress';
	} else {
		core = {
			version: wpVersion,
			vulnerabilities: [],
			name: 'WordPress',
		};
	}
	return core;
}

/**
 * Get parsed data from the initial state
 *
 * @returns {object} The information available in Protect's initial state.
 */
export default function useProtectData() {
	const { isRegistered } = useConnection();
	const { installedPlugins, installedThemes, wpVersion, statusIsFetching, status } = useSelect(
		select => ( {
			installedPlugins: select( STORE_ID ).getInstalledPlugins(),
			installedThemes: select( STORE_ID ).getInstalledThemes(),
			wpVersion: select( STORE_ID ).getWpVersion(),
			statusIsFetching: select( STORE_ID ).getStatusIsFetching(),
			status: select( STORE_ID ).getStatus(),
		} )
	);

	const { refreshStatus } = useDispatch( STORE_ID );

	useEffect( () => {
		if ( true !== statusIsFetching && isRegistered && ! status.status ) {
			refreshStatus();
		}
		// We don't want to run the effect if status changes. Only on changes on isRegistered.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ isRegistered ] );

	const plugins = mergeInstalledAndCheckedLists( installedPlugins, status.plugins || {} );
	const themes = mergeInstalledAndCheckedLists( installedThemes, status.themes || {} );
	const core = normalizeCoreInformation( wpVersion, status.wordpress );

	let currentStatus = 'error';
	if ( statusIsFetching ) {
		currentStatus = 'loading';
	} else if ( status.status ) {
		currentStatus = status.status;
	}

	return {
		numVulnerabilities: status.numVulnerabilities || 0,
		numCoreVulnerabilities: core?.vulnerabilities?.length || 0,
		numPluginsVulnerabilities: status.numPluginsVulnerabilities || 0,
		numThemesVulnerabilities: status.numThemesVulnerabilities || 0,
		lastChecked: status.lastChecked || null,
		core,
		plugins,
		themes,
		currentStatus,
	};
}
