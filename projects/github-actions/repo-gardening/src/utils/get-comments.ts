import debug from './debug.ts';
import type { OctokitClient } from '../types.ts';
import type { IssueComment } from '@octokit/webhooks-types';

// Cache for getComments.
const cache: Record< string, IssueComment[] > = {};

/**
 * Get all comments belonging to an issue.
 *
 * @param octokit - Initialized Octokit REST client.
 * @param owner   - Repository owner.
 * @param repo    - Repository name.
 * @param number  - Issue number.
 * @return Promise resolving to an array of all comments on that given issue.
 */
async function getComments(
	octokit: OctokitClient,
	owner: string,
	repo: string,
	number: number
): Promise< IssueComment[] > {
	const issueComments: IssueComment[] = [];
	const cacheKey = `${ owner }/${ repo } #${ number }`;
	if ( cache[ cacheKey ] ) {
		debug( `get-comments: Returning list of all comments on ${ cacheKey } from cache.` );
		return cache[ cacheKey ];
	}

	debug( `get-comments: Get list of all comments on ${ cacheKey }.` );

	for await ( const response of octokit.paginate.iterator( octokit.rest.issues.listComments, {
		owner,
		repo,
		issue_number: number,
		per_page: 100,
	} ) ) {
		for ( const comment of response.data ) {
			issueComments.push( comment as IssueComment );
		}
	}

	cache[ cacheKey ] = issueComments;
	return issueComments;
}

export default getComments;
