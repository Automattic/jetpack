/**
 * Internal dependencies
 */
const debug = require( '../../debug' );
const getAssociatedPullRequest = require( '../../get-associated-pull-request' );
const getNextValidMilestone = require( '../../get-next-valid-milestone' );
const getPluginNames = require( '../../get-plugin-names' );

/* global GitHub, WebhookPayloadPullRequest */

/**
 * Assigns any issues that are being worked to the author of the matching PR.
 *
 * @param {WebhookPayloadPullRequest} payload - Pull request event payload.
 * @param {GitHub}                    octokit - Initialized Octokit REST client.
 */
async function addMilestone( payload, octokit ) {
	const { commits, ref, repository } = payload;
	const { name: repo, owner } = repository;
	const ownerLogin = owner.login;

	// We should not get to that point as the action is triggered on pushes to master, but...
	if ( ref !== 'refs/heads/master' ) {
		debug( 'add-milestone: Commit is not to `master`. Aborting' );
		return;
	}

	const prNumber = getAssociatedPullRequest( commits[ 0 ] );
	if ( ! prNumber ) {
		debug( 'add-milestone: Commit is not a squashed PR. Aborting' );
		return;
	}

	const {
		data: { milestone: pullMilestone },
	} = await octokit.issues.get( { owner: ownerLogin, repo, issue_number: prNumber } );

	if ( pullMilestone ) {
		debug( 'add-milestone: Pull request already has a milestone. Aborting' );
		return;
	}

	const plugins = await getPluginNames( octokit, ownerLogin, repo, prNumber );

	if ( plugins.length === 0 ) {
		debug( 'add-milestone: No plugins for this PR. Aborting' );
		return;
	}

	if ( plugins.length >= 2 ) {
		debug(
			`add-milestone: this PR touches multiple plugins, we cannot choose which milestone this should belong to. Aborting.`
		);
		return;
	}

	// Get next valid milestone (we can only add one).
	const nextMilestone = await getNextValidMilestone( octokit, ownerLogin, repo, plugins[ 0 ] );

	if ( ! nextMilestone ) {
		throw new Error( `Could not find a valid milestone for ${ plugins[ 0 ] }` );
	}

	debug( `add-milestone: Adding PR #${ prNumber } to milestone #${ nextMilestone.number }` );

	await octokit.issues.update( {
		owner: ownerLogin,
		repo,
		issue_number: prNumber,
		milestone: nextMilestone.number,
	} );
}

module.exports = addMilestone;
