/* global GitHub */

/**
 * Internal dependencies
 */
const getLabels = require( './get-labels' );

/**
 * Get the name of the plugin concerned by this PR.
 * Default to the Jetpack plugin for now.
 *
 * @param {GitHub} octokit - Initialized Octokit REST client.
 * @param {string} owner   - Repository owner.
 * @param {string} repo    - Repository name.
 * @param {string} number  - PR / Issue number.
 *
 * @returns {Promise<string>} Promise resolving to the plugin name.
 */
async function getPluginName( octokit, owner, repo, number ) {
	let plugin;
	const labels = await getLabels( octokit, owner, repo, number );
	labels.map( label => {
		if ( label.includes( '[Plugin] Jetpack' ) ) {
			plugin = 'jetpack';
		}

		if ( label.includes( '[Plugin] Beta Plugin' ) ) {
			plugin = 'beta';
		}

		plugin = 'jetpack';
	} );

	return plugin;
}

module.exports = getPluginName;
