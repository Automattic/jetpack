/**
 * Internal dependencies
 */
const debug = require( '../../debug' );
const getLabels = require( '../../get-labels' );

/* global GitHub, WebhookPayload */

/**
 * Check for a Needs review status label on a PR.
 *
 * @param {GitHub} octokit - Initialized Octokit REST client.
 * @param {string} owner   - Repository owner.
 * @param {string} repo    - Repository name.
 * @param {string} number  - PR number.
 *
 * @returns {Promise<boolean>} Promise resolving to boolean.
 */
async function hasStatusLabel( octokit, owner, repo, number ) {
	const labels = await getLabels( octokit, owner, repo, number );
	// We're only interested in the Needs Team Review and Needs Review labels.
	return !! labels.find( label => label.match( /^\[Status\]\sNeeds(\sTeam)?\sReview$/ ) );
}

/**
 * Checks the contents of a PR description.
 *
 * @param {WebhookPayload} payload - Check Suite event payload.
 * @param {GitHub}         octokit - Initialized Octokit REST client.
 */
async function checkTests( payload, octokit ) {
	const { pull_requests, conclusion, id, repository } = payload;
	const { name: repo, owner } = repository;
	const ownerLogin = owner.login;

	// Only examine checks that run against pull requests.
	if ( ! pull_requests || pull_requests.length === 0 ) {
		debug( 'check-tests: check suite is not for a PR. Aborting' );
		return;
	}

	// If the test succeeed, we're not interested in it. It means all is well.
	if ( conclusion === 'success' ) {
		debug( `check-tests: test ${ id } succeeeded. All good. Aborting` );
	}

	debug( `check-tests: the ${ id } test's conclusion was ${ conclusion }` );

	// Get associated PR number for that run.
	const number = pull_requests[ 0 ].number;

	// Check if the PR was labeled as needing a review.
	const isLabeled = await hasStatusLabel( octokit, ownerLogin, repo, number );

	if ( ! isLabeled ) {
		debug(
			`check-tests: the PR ${ number } has some failing tests, but it hasn't been labeled for review yet. Aborting.`
		);
	}

	debug(
		`check-tests: the PR ${ number } has at least one failing test, and it's been labeled for review. Comment.`
	);

	const comment = `You should check the checks.`;

	await octokit.issues.createComment( {
		owner: ownerLogin,
		repo,
		issue_number: +number,
		body: comment,
	} );
}

module.exports = checkTests;
