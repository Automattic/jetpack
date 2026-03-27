import debug from '../debug.ts';
import type { OctokitClient } from '../../types.ts';

// Cache for getLabels.
const cache: Record< string, string[] > = {};

/**
 * Get labels on a PR.
 *
 * @param octokit - Initialized Octokit REST client.
 * @param owner   - Repository owner.
 * @param repo    - Repository name.
 * @param number  - PR number.
 * @return Promise resolving to an array of all labels for that PR.
 */
async function getLabels(
	octokit: OctokitClient,
	owner: string,
	repo: string,
	number: number
): Promise< string[] > {
	const labelList: string[] = [];
	const cacheKey = `${ owner }/${ repo } #${ number }`;
	if ( cache[ cacheKey ] ) {
		debug( `get-labels: Returning list of labels on ${ cacheKey } from cache.` );
		return cache[ cacheKey ];
	}

	debug( `get-labels: Get list of labels on ${ cacheKey }.` );

	for await ( const response of octokit.paginate.iterator( octokit.rest.issues.listLabelsOnIssue, {
		owner,
		repo,
		issue_number: number,
		per_page: 100,
	} ) ) {
		for ( const label of response.data ) {
			labelList.push( label.name );
		}
	}

	cache[ cacheKey ] = labelList;
	return labelList;
}

export default getLabels;
