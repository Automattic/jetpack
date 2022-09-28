const debug = require( '../../utils/debug' );

/* global GitHub, WebhookPayloadPullRequest */

/**
 * Assigns any issues that are being worked to the author of the matching PR.
 *
 * @param {WebhookPayloadPullRequest} payload - Pull request event payload.
 * @param {GitHub}                    octokit - Initialized Octokit REST client.
 */
async function assignIssues( payload, octokit ) {
	const regex = /(?:close|closes|closed|fix|fixes|fixed|resolve|resolves|resolved):? +(?:#{1}|https?:\/\/github\.com\/automattic\/jetpack\/issues\/)(\d+)/gi;

	let match;
	while ( ( match = regex.exec( payload.pull_request.body ) ) ) {
		const [ , issue ] = match;

		debug( `assign-issues: Assigning issue #${ issue } to @${ payload.pull_request.user.login }` );

		await octokit.rest.issues.addAssignees( {
			owner: payload.repository.owner.login,
			repo: payload.repository.name,
			issue_number: +issue,
			assignees: [ payload.pull_request.user.login ],
		} );

		debug( `assign-issues: Applying '[Status] In Progress' label to issue #${ issue }` );

		await octokit.rest.issues.addLabels( {
			owner: payload.repository.owner.login,
			repo: payload.repository.name,
			issue_number: +issue,
			labels: [ '[Status] In Progress' ],
		} );
	}
}

module.exports = assignIssues;
