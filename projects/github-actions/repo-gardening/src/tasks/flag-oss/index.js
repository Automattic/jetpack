const { getInput, setFailed } = require( '@actions/core' );
const debug = require( '../../utils/debug' );
const sendSlackMessage = require( '../../utils/send-slack-message' );

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

	debug( `flag-oss: Adding OSS Citizen label to PR #${ number }` );
	await octokit.rest.issues.addLabels( {
		owner: owner.login,
		repo: name,
		issue_number: number,
		labels: [ 'OSS Citizen' ],
	} );

	const slackToken = getInput( 'slack_token' );
	if ( ! slackToken ) {
		setFailed( `flag-oss: Input slack_token is required but missing. Aborting.` );
		return;
	}

	const channel = getInput( 'slack_team_channel' );
	if ( ! channel ) {
		setFailed( `flag-oss: Input slack_team_channel is required but missing. Aborting.` );
		return;
	}

	debug( `flag-oss: Sending in OSS Slack message about PR #${ number }.` );
	await sendSlackMessage(
		`An external contributor submitted this PR. Be sure to go welcome them! 👏`,
		channel,
		slackToken,
		payload
	);
}

module.exports = flagOss;
