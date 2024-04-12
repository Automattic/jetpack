const { getInput, setFailed } = require( '@actions/core' );
const debug = require( '../../utils/debug' );
const sendSlackMessage = require( '../../utils/slack/send-slack-message' );

/* global GitHub, WebhookPayloadPullRequest */

/**
 * Adds the OSS Citizen label to all PRs opened from a fork, and send a slack message.
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

	// Check if PR author is org member
	// https://docs.github.com/en/rest/orgs/members?apiVersion=2022-11-28#check-organization-membership-for-a-user
	const orgMembershipRequest = await octokit.rest.orgs.checkMembershipForUser( {
		org: owner.login,
		username: head.user.login,
	} );

	if ( 204 === orgMembershipRequest.status ) {
		return;
	}

	debug( `flag-oss: Adding OSS Citizen label to PR #${ number }` );
	await octokit.rest.issues.addLabels( {
		owner: owner.login,
		repo: name,
		issue_number: number,
		labels: [ 'OSS Citizen' ],
	} );

	const channel = getInput( 'slack_team_channel' );
	if ( ! channel ) {
		setFailed( `flag-oss: Input slack_team_channel is required but missing. Aborting.` );
		return;
	}

	debug( `flag-oss: Sending in OSS Slack message about PR #${ number }.` );
	await sendSlackMessage(
		`An external contributor submitted this PR. Be sure to go welcome them! 👏`,
		channel,
		payload
	);
}

module.exports = flagOss;
