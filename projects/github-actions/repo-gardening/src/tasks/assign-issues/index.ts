import debug from '../../utils/debug.ts';
import type { OctokitClient, PullRequestEvent } from '../../types.ts';

/**
 * Assigns any issues that are being worked to the author of the matching PR.
 *
 * @param payload - Pull request event payload.
 * @param octokit - Initialized Octokit REST client.
 */
async function assignIssues( payload: PullRequestEvent, octokit: OctokitClient ): Promise< void > {
	const regex =
		/(?:close|closes|closed|fix|fixes|fixed|resolve|resolves|resolved):? +(?:#{1}|https?:\/\/github\.com\/automattic\/jetpack\/issues\/)(\d+)/gi;

	let match;
	while ( ( match = regex.exec( payload.pull_request.body ?? '' ) ) ) {
		const [ , issue ] = match;

		debug( `assign-issues: Assigning issue #${ issue } to @${ payload.pull_request.user.login }` );

		await octokit.rest.issues.addAssignees( {
			owner: payload.repository.owner.login,
			repo: payload.repository.name,
			issue_number: Number( issue ),
			assignees: [ payload.pull_request.user.login ],
		} );
	}
}

export default assignIssues;
