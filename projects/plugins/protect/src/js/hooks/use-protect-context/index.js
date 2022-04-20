/* global jetpackProtectInitialState */

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
			// camelCase fixedIn.
			if ( checked[ slug ].vulnerabilities.length > 0 ) {
				checked[ slug ].vulnerabilities.forEach( ( vul, i ) => {
					checked[ slug ].vulnerabilities[ i ].fixedIn = vul.fixed_in;
				} );
			}
			checked[ slug ].name = installed[ slug ].Name;
			checked[ slug ].notChecked = false;
			newList.push( checked[ slug ] );
		} else {
			newList.push( {
				name: installed[ slug ].Name,
				version: installed[ slug ].version,
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
export default function useProtectContext() {
	const { installedPlugins, installedThemes, status } = jetpackProtectInitialState;

	const plugins = mergeInstalledAndCheckedLists( installedPlugins, status.plugins );
	const themes = mergeInstalledAndCheckedLists( installedThemes, status.themes );

	return {
		status: status.status,
		numVulnerabilities: status.num_vulnerabilities,
		numPluginsVulnerabilities: status.num_plugins_vulnerabilities,
		numThemesVulnerabilities: status.num_themes_vulnerabilities,
		lastChecked: status.last_checked,
		core: status.wordpress,
		plugins,
		themes,
	};
}
