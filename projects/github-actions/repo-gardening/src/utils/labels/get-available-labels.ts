import debug from '../debug.ts';
import type { OctokitClient } from '../../types.ts';

/**
 * Represents a label in a GitHub repository.
 */
interface RepoLabel {
	name: string;
	[ key: string ]: unknown;
}

// Cache for getLabels.
const cache: Record< string, RepoLabel[] > = {};

/**
 * Get all the labels available in the repo.
 *
 * @param octokit - Initialized Octokit REST client.
 * @param owner   - Repository owner.
 * @param repo    - Repository name.
 * @param filter  - Optionally filter to only return a subset of labels. Use a regex pattern.
 * @return Promise resolving to an array of all labels in the repo.
 */
async function getAvailableLabels(
	octokit: OctokitClient,
	owner: string,
	repo: string,
	filter: RegExp | string = ''
): Promise< RepoLabel[] > {
	let labelList: RepoLabel[];
	const cacheKey = `${ owner }/${ repo }`;
	if ( cache[ cacheKey ] ) {
		debug( `get-all-labels: Using list of labels for ${ cacheKey } from cache.` );
		labelList = cache[ cacheKey ];
	} else {
		debug( `get-all-labels: Get list of labels for ${ cacheKey }.` );
		labelList = [];
		for await ( const response of octokit.paginate.iterator(
			octokit.rest.issues.listLabelsForRepo,
			{
				owner,
				repo,
				per_page: 100,
			}
		) ) {
			for ( const label of response.data ) {
				labelList.push( label as RepoLabel );
			}
		}
		cache[ cacheKey ] = labelList;
	}

	return filter ? labelList.filter( label => label.name.match( filter ) ) : labelList;
}

export default getAvailableLabels;
