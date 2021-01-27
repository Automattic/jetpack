/**
 * Internal dependencies
 */
const debug = require( '../../debug' );
const getAssociatedPullRequest = require( '../../get-associated-pull-request' );
const getNextValidMilestone = require( '../../get-next-valid-milestone' );
const getLabels = require( '../../get-labels' );

/* global GitHub, WebhookPayloadPullRequest */

/**
 * Assigns any issues that are being worked to the author of the matching PR.
 *
 * @param {WebhookPayloadPullRequest} payload - Pull request event payload.
 * @param {GitHub}                    octokit - Initialized Octokit REST client.
 */
async function addMilestone( payload, octokit ) {
	// We should not get to that point as the action is triggered on pushes to master, but...
	if ( payload.ref !== 'refs/heads/master' ) {
		debug( 'add-milestone: Commit is not to `master`. Aborting' );
		return;
	}

	const prNumber = getAssociatedPullRequest( payload.commits[ 0 ] );
	if ( ! prNumber ) {
		debug( 'add-milestone: Commit is not a squashed PR. Aborting' );
		return;
	}

	// No need to do anything if the PR already has a milestone.
	const owner = payload.repository.owner.login;
	const repo = payload.repository.name;
	const {
		data: { milestone: pullMilestone },
	} = await octokit.issues.get( { owner, repo, issue_number: prNumber } );

	if ( pullMilestone ) {
		debug( 'add-milestone: Pull request already has a milestone. Aborting' );
		return;
	}

	const labels = await getLabels( octokit, owner, repo, prNumber );

	// Find out what plugin we need to worry about.
	// We default to the Jetpack plugin for now.
	let plugin;
	labels.map( label => {
		if ( label.includes( '[Plugin] Jetpack' ) ) {
			plugin = 'jetpack';
		}

		if ( label.includes( '[Plugin] Beta Plugin' ) ) {
			plugin = 'beta';
		}

		plugin = 'jetpack';
	} );

	// Get next valid milestone.
	const nextMilestone = await getNextValidMilestone( octokit, owner, repo, plugin );

	if ( ! nextMilestone ) {
		throw new Error( 'Could not find a valid milestone' );
	}

	debug( `add-milestone: Adding PR #${ prNumber } to milestone #${ nextMilestone.number }` );

	await octokit.issues.update( {
		owner,
		repo,
		issue_number: prNumber,
		milestone: nextMilestone.number,
	} );
}

module.exports = addMilestone;
