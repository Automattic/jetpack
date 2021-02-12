/**
 * External dependencies
 */
const moment = require( 'moment' );

/**
 * Internal dependencies
 */
const debug = require( '../../debug' );
const getLabels = require( '../../get-labels' );
const getNextValidMilestone = require( '../../get-next-valid-milestone' );
const getPluginName = require( '../../get-plugin-name' );

/* global GitHub, WebhookPayloadPullRequest */

/**
 * Check if a PR has unverified commits.
 *
 * @param {GitHub} octokit - Initialized Octokit REST client.
 * @param {string} owner   - Repository owner.
 * @param {string} repo    - Repository name.
 * @param {string} number  - PR number.
 *
 * @returns {Promise<boolean>} Promise resolving to boolean.
 */
async function hasUnverifiedCommit( octokit, owner, repo, number ) {
	let isUnverified = false;

	for await ( const response of octokit.paginate.iterator( octokit.pulls.listCommits, {
		owner: owner.login,
		repo,
		pull_number: +number,
	} ) ) {
		isUnverified = !! response.data.find( commit =>
			commit.commit.message.includes( '[not verified]' )
		);
	}

	return isUnverified;
}

/**
 * Check for status labels on a PR.
 *
 * @param {GitHub} octokit - Initialized Octokit REST client.
 * @param {string} owner   - Repository owner.
 * @param {string} repo    - Repository name.
 * @param {string} number  - PR number.
 *
 * @returns {Promise<boolean>} Promise resolving to boolean.
 */
async function hasStatusLabels( octokit, owner, repo, number ) {
	const labels = await getLabels( octokit, owner, repo, number );
	// We're really only interested in status labels
	return !! labels.find( label => label.includes( '[Status]' ) );
}

/**
 * Build a string with info about the next milestone.
 *
 * @param {GitHub} octokit - Initialized Octokit REST client.
 * @param {string} owner   - Repository owner.
 * @param {string} repo    - Repository name.
 * @param {string} number  - PR number.
 *
 * @returns {Promise<string>} Promise resolving to info about the next release for that plugin.
 */
async function buildMilestoneInfo( octokit, owner, repo, number ) {
	const plugin = await getPluginName( octokit, owner, repo, number );
	debug( `check-description: plugin found: ${ plugin }` );

	// Get next valid milestone.
	const ownerLogin = owner.login;
	const nextMilestone = await getNextValidMilestone( octokit, ownerLogin, repo, plugin );

	debug( `check-description: Milestone found: ${ nextMilestone }` );

	let releaseDate;
	let codeFreezeDate;
	if ( nextMilestone ) {
		releaseDate = moment( nextMilestone.due_on ).format( 'LL' );

		// Look for a code freeze date in the milestone description.
		const dateRegex = /^Code Freeze: (\d{4}-\d{2}-\d{2})\s*$/m;
		const freezeDateDescription = nextMilestone.description.match( dateRegex );

		// If we have a date and it is valid, use it, otherwise set code freeze to a week before the release.
		if ( freezeDateDescription && moment( freezeDateDescription[ 1 ] ).isValid() ) {
			codeFreezeDate = moment( freezeDateDescription[ 1 ] ).format( 'LL' );
		} else {
			codeFreezeDate = moment( nextMilestone.due_on ).subtract( 7, 'd' ).format( 'LL' );
		}
	} else {
		// Fallback to raw math calculation
		// Calculate next release date
		const firstTuesdayOfMonth = moment().add( 1, 'months' ).startOf( 'month' );
		while ( firstTuesdayOfMonth.day() !== 2 ) {
			firstTuesdayOfMonth.add( 1, 'day' );
		}
		releaseDate = firstTuesdayOfMonth.format( 'LL' );
		// Calculate next code freeze date
		codeFreezeDate = firstTuesdayOfMonth.subtract( 8, 'd' ).format( 'LL' );
	}

	return `
******

Next scheduled release: _${ releaseDate }_.
Scheduled code freeze: _${ codeFreezeDate }_`;
}

/**
 * Search for a previous comment from this task in our PR.
 *
 * @param {GitHub} octokit - Initialized Octokit REST client.
 * @param {string} owner   - Repository owner.
 * @param {string} repo    - Repository name.
 * @param {string} number  - PR number.
 *
 * @returns {Promise<number>} Promise resolving to boolean.
 */
async function getCheckComment( octokit, owner, repo, number ) {
	let commentID = 0;

	debug( `check-description: Looking for a previous comment from this task in our PR.` );

	for await ( const response of octokit.paginate.iterator( octokit.issues.listComments, {
		owner: owner.login,
		repo,
		issue_number: +number,
	} ) ) {
		response.data.map( comment => {
			if (
				comment.user.login === 'github-actions[bot]' &&
				comment.body.includes( '**Thank you for your PR!**' )
			) {
				commentID = comment.id;
			}
		} );
	}

	return commentID;
}

/**
 * Checks the contents of a PR description.
 *
 * @param {WebhookPayloadPullRequest} payload - Pull request event payload.
 * @param {GitHub}                    octokit - Initialized Octokit REST client.
 */
async function checkDescription( payload, octokit ) {
	const { body, number } = payload.pull_request;
	const { name: repo, owner } = payload.repository;

	debug( `check-description: start building our comment` );

	// We'll add any remarks we may have about the PR to that comment body.
	let comment = `**Thank you for your PR!**

When contributing to Jetpack, we have [a few suggestions](https://github.com/Automattic/jetpack/blob/master/.github/PULL_REQUEST_TEMPLATE.md) that can help us test and review your patch:<br>`;

	// No PR is too small to include a description of why you made a change
	comment += `
- ${
		body < 10 ? `:red_circle:` : `:white_check_mark:`
	} Include a description of your PR changes.<br>`;

	// Check all commits in PR.
	const isDirty = await hasUnverifiedCommit( octokit, owner, repo, number );
	comment += `
- ${ isDirty ? `:red_circle:` : `:white_check_mark:` } All commits were linted before commit.<br>`;

	// Use labels please!
	const isLabeled = await hasStatusLabels( octokit, owner, repo, number );
	debug( `check-description: this PR is correctly labeled: ${ isLabeled }` );
	comment += `
- ${
		! isLabeled ? `:red_circle:` : `:white_check_mark:`
	} Add a "[Status]" label (In Progress, Needs Team Review, ...) if possible.<br>`;

	// Check for testing instructions.
	comment += `
- ${
		! body.includes( 'Testing instructions' ) ? `:red_circle:` : `:white_check_mark:`
	} Add testing instructions.<br>`;

	// Check for a proposed changelog entry.
	comment += `
- ${
		! body.includes( 'Proposed changelog entry' ) ? `:red_circle:` : `:white_check_mark:`
	} Include a changelog entry for any meaningful change.<br>`;

	// Check if the Privacy section is filled in.
	comment += `
- ${
		! body.includes( 'data or activity we track or use' ) ? `:red_circle:` : `:white_check_mark:`
	} Specify whether this PR includes any changes to data or privacy.<br>`;

	debug( `check-description: privacy checked. our comment so far is ${ comment }` );

	comment += `


This comment will be updated as you work on your PR and make changes. If you think that some of those checks are not needed for your PR, please explain why you think so. Thanks for cooperation :robot:

******

If you are an automattician, once your PR is ready for review add the "[Status] Needs Team review" label and ask someone from your team review the code.
Once you’ve done so, switch to the "[Status] Needs Review" label; someone from Jetpack Crew will then review this PR and merge it to be included in the next Jetpack release.`;

	// Gather info about the next release for that plugin.
	const milestoneInfo = await buildMilestoneInfo( octokit, owner, repo, number );
	comment += milestoneInfo;

	// Look for an existing check-description task comment.
	const existingComment = await getCheckComment( octokit, owner, repo, number );

	// If there is a comment already, update it.
	if ( existingComment !== 0 ) {
		debug( `check-description: update comment ID ${ existingComment } with our new remarks` );
		await octokit.issues.updateComment( {
			owner: owner.login,
			repo,
			comment_id: +existingComment,
			body: comment,
		} );
	} else {
		// If no comment was published before, publish one now.
		debug( `check-description: Posting comment to PR #${ number }` );

		await octokit.issues.createComment( {
			owner: owner.login,
			repo,
			issue_number: +number,
			body: comment,
		} );
	}
}

module.exports = checkDescription;
