const debug = require( '../../debug' );
const getAssociatedPullRequest = require( '../../get-associated-pull-request' );

/* global GitHub, WebhookPayloadPush */

/**
 * Search for a previous comment from this task in our PR.
 * If we find one, return its body.
 *
 * @param {GitHub} octokit - Initialized Octokit REST client.
 * @param {string} owner   - Repository owner.
 * @param {string} repo    - Repository name.
 * @param {string} number  - PR number.
 * @returns {Promise<string>} Promise resolving to a string.
 */
async function getMatticBotComment( octokit, owner, repo, number ) {
	let commentBody = '';

	debug( `wpcom-commit-reminder: Looking for a comment from Matticbot on this PR.` );

	for await ( const response of octokit.paginate.iterator( octokit.rest.issues.listComments, {
		owner: owner.login,
		repo,
		issue_number: +number,
	} ) ) {
		response.data.map( comment => {
			if (
				comment.user.login === 'matticbot' &&
				comment.body.includes( 'This PR has changes that must be merged to WordPress.com' )
			) {
				commentBody = comment.body;
			}
		} );
	}

	return commentBody;
}

/**
 * Search for a previous comment from this task in our PR.
 *
 * @param {GitHub} octokit - Initialized Octokit REST client.
 * @param {string} owner   - Repository owner.
 * @param {string} repo    - Repository name.
 * @param {string} number  - PR number.
 * @returns {Promise<boolean>} Promise resolving to boolean.
 */
async function hasReminderComment( octokit, owner, repo, number ) {
	debug( `wpcom-commit-reminder: Looking for a previous comment from this task in our PR.` );

	for await ( const response of octokit.paginate.iterator( octokit.rest.issues.listComments, {
		owner: owner.login,
		repo,
		issue_number: +number,
	} ) ) {
		response.data.map( comment => {
			if (
				comment.user.login === 'github-actions[bot]' &&
				comment.body.includes( 'Great news! One last step' )
			) {
				return true;
			}
		} );
	}

	return false;
}

/**
 * Checks the contents of a PR description.
 *
 * @param {WebhookPayloadPush} payload - Push event payload.
 * @param {GitHub}             octokit - Initialized Octokit REST client.
 */
async function wpcomCommitReminder( payload, octokit ) {
	const { commits, ref, repository } = payload;
	const { name: repo, owner } = repository;

	// We should not get to that point as the action is triggered on pushes to trunk, but...
	if ( ref !== 'refs/heads/trunk' ) {
		debug( 'wpcom-commit-reminder: Commit is not to `trunk`. Aborting' );
		return;
	}

	const prNumber = getAssociatedPullRequest( commits[ 0 ] );
	if ( ! prNumber ) {
		debug( 'wpcom-commit-reminder: Commit is not a squashed PR. Aborting' );
		return;
	}

	// Look for an existing check-description task comment.
	const matticBotComment = await getMatticBotComment( octokit, owner, repo, prNumber );

	// get diff id from comment body above.
	const diffId = matticBotComment.match( /(D\d{5}-code)/ );

	if ( ! diffId || 0 === diffId.length ) {
		debug( 'wpcom-commit-reminder: We could not find a diff ID. Aborting' );
		return;
	}
	// Build our comment body.
	const comment = `
Great news! One last step: head over to your WordPress.com diff, ${ diffId[ 0 ] }, and deploy it.
Once you've done so, come back to this PR and add a comment with your changeset ID.

**Thank you!**
	`;

	// Look for an existing reminder comment.
	const hasComment = await hasReminderComment( octokit, owner, repo, prNumber );

	// If there is no comment yet, go ahead and comment.
	if ( ! hasComment ) {
		debug( `wpcom-commit-reminder: Posting comment to PR #${ prNumber }` );

		await octokit.rest.issues.createComment( {
			owner: owner.login,
			repo,
			issue_number: +prNumber,
			body: comment,
		} );
	}
}

module.exports = wpcomCommitReminder;
