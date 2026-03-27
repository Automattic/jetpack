import { getInput, setFailed } from '@actions/core';
import debug from '../../utils/debug.ts';
import sendSlackMessage from '../../utils/slack/send-slack-message.ts';
import type { OctokitClient, PullRequestEvent } from '../../types.ts';

/**
 * Adds the OSS Citizen label to all PRs opened from a fork, and send a slack message.
 *
 * @param payload - Pull request event payload.
 * @param octokit - Initialized Octokit REST client.
 */
async function flagOss( payload: PullRequestEvent, octokit: OctokitClient ): Promise< void > {
	const { number, repository, pull_request } = payload;
	const { head, base } = pull_request;
	const { owner, name } = repository;

	// Assume PR author is org member if the PR isn't from a fork.
	if ( head.repo?.full_name === base.repo.full_name ) {
		return;
	}

	// Check if PR author is org member
	// Result is communicated by status code, and non-successful status codes throw.
	// https://docs.github.com/en/rest/orgs/members?apiVersion=2022-11-28#check-organization-membership-for-a-user
	try {
		await octokit.rest.orgs.checkMembershipForUser( {
			org: owner.login,
			username: head.user.login,
		} );
	} catch {
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
}

export default flagOss;
