import getLabels from './labels/get-labels.ts';
import type { OctokitClient } from '../types.ts';

/**
 * Get the name of the plugin concerned by this PR.
 *
 * @param octokit - Initialized Octokit REST client.
 * @param owner   - Repository owner.
 * @param repo    - Repository name.
 * @param number  - PR / Issue number.
 * @return Promise resolving to an array of all the plugins touched by that PR.
 */
async function getPluginNames(
	octokit: OctokitClient,
	owner: string,
	repo: string,
	number: number
): Promise< string[] > {
	const plugins: string[] = [];
	const labels = await getLabels( octokit, owner, repo, number );
	for ( const label of labels ) {
		const plugin = label.match( /^\[Plugin\]\s(?<pluginName>[^/]*)$/ );
		if ( plugin?.groups?.pluginName ) {
			plugins.push( plugin.groups.pluginName.replace( /\s+/, '-' ).toLowerCase() );
		}
	}

	return plugins;
}

export default getPluginNames;
