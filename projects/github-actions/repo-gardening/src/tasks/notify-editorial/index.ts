import { getInput, setFailed } from '@actions/core';
import debug from '../../utils/debug.ts';
import getLabels from '../../utils/labels/get-labels.ts';
import sendSlackMessage from '../../utils/slack/send-slack-message.ts';
import type { OctokitClient, PullRequestEvent } from '../../types.ts';

/**
 * Check for an Copy Review status label on a PR.
 *
 * @param octokit - Initialized Octokit REST client.
 * @param owner   - Repository owner.
 * @param repo    - Repository name.
 * @param number  - PR number.
 * @return Promise resolving to boolean.
 */
async function hasNeedsCopyReviewLabel(
	octokit: OctokitClient,
	owner: string,
	repo: string,
	number: number
): Promise< boolean > {
	const labels = await getLabels( octokit, owner, repo, number );
	// We're only interested in the Needs Copy Review label.
	return labels.includes( '[Status] Needs Copy Review' );
}

/**
 * Check for a Needs Copy label on a PR.
 *
 * @param octokit - Initialized Octokit REST client.
 * @param owner   - Repository owner.
 * @param repo    - Repository name.
 * @param number  - PR number.
 * @return Promise resolving to boolean.
 */
async function hasNeedsCopyLabel(
	octokit: OctokitClient,
	owner: string,
	repo: string,
	number: number
): Promise< boolean > {
	const labels = await getLabels( octokit, owner, repo, number );
	// We're only interested in the Needs Copy label.
	return labels.includes( '[Status] Needs Copy' );
}

/**
 * Check for an Editorial Input Requested label on a PR.
 *
 * @param octokit - Initialized Octokit REST client.
 * @param owner   - Repository owner.
 * @param repo    - Repository name.
 * @param number  - PR number.
 * @return Promise resolving to boolean.
 */
async function hasEditorialInputRequestedLabel(
	octokit: OctokitClient,
	owner: string,
	repo: string,
	number: number
): Promise< boolean > {
	const labels = await getLabels( octokit, owner, repo, number );
	// We're only interested in the Editorial Input Requested label.
	return labels.includes( '[Status] Editorial Input Requested' );
}

/**
 * Send a Slack notification about a label to the Editorial team.
 *
 * @param payload - Pull request event payload.
 * @param octokit - Initialized Octokit REST client.
 */
async function notifyEditorial(
	payload: PullRequestEvent,
	octokit: OctokitClient
): Promise< void > {
	const { number, repository } = payload;
	const { owner, name: repo } = repository;
	const ownerLogin = owner.login;

	const slackToken = getInput( 'slack_token' );
	if ( ! slackToken ) {
		setFailed( `notify-editorial: Input slack_token is required but missing. Aborting.` );
		return;
	}

	const channel = getInput( 'slack_editorial_channel' );
	if ( ! channel ) {
		setFailed(
			`notify-editorial: Input slack_editorial_channel is required but missing. Aborting.`
		);
		return;
	}

	// Check if editorial input was already requested for that PR.
	const hasBeenRequested = await hasEditorialInputRequestedLabel(
		octokit,
		ownerLogin,
		repo,
		number
	);
	if ( hasBeenRequested ) {
		debug(
			`notify-editorial: Editorial input was already requested for PR #${ number }. Aborting.`
		);
		return;
	}

	// Check for a Needs Copy Review label.
	const isLabeledForCopy = await hasNeedsCopyLabel( octokit, ownerLogin, repo, number );
	if ( isLabeledForCopy ) {
		debug(
			`notify-editorial: Found a Needs Copy label on PR #${ number }. Sending in Slack message.`
		);
		await sendSlackMessage(
			`Someone would be interested in input from the Editorial team on this topic.`,
			channel,
			payload
		);
	}

	// Check for a Needs Copy Review label.
	const isLabeledForReview = await hasNeedsCopyReviewLabel( octokit, ownerLogin, repo, number );
	if ( isLabeledForReview ) {
		debug(
			`notify-editorial: Found a Needs Copy Review label on PR #${ number }. Sending in Slack message.`
		);
		await sendSlackMessage(
			`Someone is looking for a review from the Editorial team.`,
			channel,
			payload
		);
	}

	if ( isLabeledForCopy || isLabeledForReview ) {
		debug(
			`notify-editorial: Adding a label to PR #${ number } to show that design input was requested.`
		);
		await octokit.rest.issues.addLabels( {
			owner: ownerLogin,
			repo,
			issue_number: number,
			labels: [ '[Status] Editorial Input Requested' ],
		} );
	}
}

export default notifyEditorial;
