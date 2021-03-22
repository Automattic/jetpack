/**
 * Internal dependencies
 */
const debug = require( '../../debug' );
const getAssociatedPullRequest = require( '../../get-associated-pull-request' );

/* global GitHub, WebhookPayloadPush */

/**
 * Manage labels once a PR has been merged.
 *
 * @param {WebhookPayloadPush} payload - Push event payload.
 * @param {GitHub}             octokit - Initialized Octokit REST client.
 */
async function cleanLabels( payload, octokit ) {
	const { commits, repository, ref } = payload;
	const { name: repo, owner } = repository;
	const ownerLogin = owner.login;

	// We should not get to that point as the action is triggered on pushes to master, but...
	if ( ref !== 'refs/heads/master' ) {
		debug( 'clean-labels: Commit is not to `master`. Aborting' );
		return;
	}

	const prNumber = getAssociatedPullRequest( commits[ 0 ] );
	if ( ! prNumber ) {
		debug( 'clean-labels: Commit is not a squashed PR. Aborting' );
		return;
	}

	debug( `clean-labels: remove the [Status] Ready to merge label from PR #${ prNumber }` );
	octokit.issues.removeLabel( {
		owner: ownerLogin,
		repo,
		issue_number: prNumber,
		name: '[Status] Ready to Merge',
	} );

	debug( `clean-labels: remove the [Status] Needs Review label from PR #${ prNumber }` );
	octokit.issues.removeLabel( {
		owner: ownerLogin,
		repo,
		issue_number: prNumber,
		name: '[Status] Needs Review',
	} );

	debug( `clean-labels: remove the [Status] Needs Team Review label from PR #${ prNumber }` );
	octokit.issues.removeLabel( {
		owner: ownerLogin,
		repo,
		issue_number: prNumber,
		name: '[Status] Needs Team Review',
	} );

	debug( `clean-labels: remove the [Status] In Progress label from PR #${ prNumber }` );
	octokit.issues.removeLabel( {
		owner: ownerLogin,
		repo,
		issue_number: prNumber,
		name: '[Status] In Progress',
	} );

	debug( `clean-labels: remove the [Status] Needs Author Reply label from PR #${ prNumber }` );
	octokit.issues.removeLabel( {
		owner: ownerLogin,
		repo,
		issue_number: prNumber,
		name: '[Status] Needs Author Reply',
	} );
}

module.exports = cleanLabels;
