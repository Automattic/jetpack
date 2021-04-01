/**
 * Internal dependencies
 */
const debug = require( '../../debug' );

/* global GitHub, WebhookPayloadPullRequest */

/**
 * Adds the OSS Citizen label to all PRs opened from a fork.
 *
 * @param {WebhookPayloadPullRequest} payload - Pull request event payload.
 * @param {GitHub}                    octokit - Initialized Octokit REST client.
 */
async function flagOss( payload, octokit ) {
	const { number, repository, pull_request } = payload;
	const { head, base } = pull_request;
	const { owner, name } = repository;

	if ( head.repo.full_name === base.repo.full_name ) {
		return;
	}

	debug( `flag-oss: Adding OSS Citizen label to PR #${ number }` );
	await octokit.issues.addLabels( {
		owner: owner.login,
		repo: name,
		issue_number: number,
		labels: [ 'OSS Citizen' ],
	} );
}

module.exports = flagOss;
