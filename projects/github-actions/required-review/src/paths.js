import * as core from '@actions/core';
import * as github from '@actions/github';
import { WError } from 'error';

/**
 * Fetch the paths in the current PR.
 *
 * @return {string[]} Paths.
 */
export async function fetchPaths() {
	const octokit = github.getOctokit( core.getInput( 'token', { required: true } ) );
	const owner = github.context.payload.repository.owner.login;
	const repo = github.context.payload.repository.name;
	const pr = github.context.payload.pull_request.number;

	const paths = {};
	try {
		for await ( const res of octokit.paginate.iterator( octokit.rest.pulls.listFiles, {
			owner: owner,
			repo: repo,
			pull_number: pr,
			per_page: 100,
		} ) ) {
			res.data.forEach( file => {
				paths[ file.filename ] = true;
				if ( file.previous_filename ) {
					paths[ file.previous_filename ] = true;
				}
			} );
		}
	} catch ( error ) {
		throw new WError(
			`Failed to query ${ owner }/${ repo } PR #${ pr } files from GitHub`,
			error,
			{}
		);
	}

	return Object.keys( paths ).sort();
}
