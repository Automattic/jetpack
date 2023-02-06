/* global GitHub */

const getLabels = require( './get-labels' );

/**
 * Get the name of the plugin concerned by this PR.
 *
 * @param {GitHub} octokit - Initialized Octokit REST client.
 * @param {string} owner   - Repository owner.
 * @param {string} repo    - Repository name.
 * @param {string} number  - PR / Issue number.
 * @returns {Promise<Array>} Promise resolving to an array of all the plugins touched by that PR.
 */
async function getPluginNames( octokit, owner, repo, number ) {
	const plugins = [];
	const labels = await getLabels( octokit, owner, repo, number );
	labels.map( label => {
		const plugin = label.match( /^\[Plugin\]\s(?<pluginName>[^/]*)$/ );
		if ( plugin && plugin.groups.pluginName ) {
			plugins.push( plugin.groups.pluginName.replace( /\s+/, '-' ).toLowerCase() );
		}
	} );

	return plugins;
}

module.exports = getPluginNames;
