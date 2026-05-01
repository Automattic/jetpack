import debug from './debug.ts';
import type { OctokitClient } from '../types.ts';

// Cache for getFiles.
const cache: Record< string, string[] > = {};

/**
 * Get list of files modified in PR.
 *
 * @param octokit - Initialized Octokit REST client.
 * @param owner   - Repository owner.
 * @param repo    - Repository name.
 * @param number  - PR number.
 * @return Promise resolving to an array of all files modified in that PR.
 */
async function getFiles(
	octokit: OctokitClient,
	owner: string,
	repo: string,
	number: number
): Promise< string[] > {
	const fileList: string[] = [];
	const cacheKey = `${ owner }/${ repo } #${ number }`;
	if ( cache[ cacheKey ] ) {
		debug( `get-files: Returning list of files modified ${ cacheKey } from cache.` );
		return cache[ cacheKey ];
	}

	debug( `get-files: Get list of files modified in ${ cacheKey }.` );

	for await ( const response of octokit.paginate.iterator( octokit.rest.pulls.listFiles, {
		owner,
		repo,
		pull_number: number,
		per_page: 100,
	} ) ) {
		for ( const file of response.data ) {
			fileList.push( file.filename );
			if ( file.previous_filename ) {
				fileList.push( file.previous_filename );
			}
		}
	}

	cache[ cacheKey ] = fileList;
	return fileList;
}

export default getFiles;
