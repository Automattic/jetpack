/**
 * External dependencies
 */
const moment = require( 'moment' );

/**
 * Internal dependencies
 */
const debug = require( '../../debug' );
const getAssociatedPullRequest = require( '../../get-associated-pull-request' );

/**
 * Returns a promise resolving to the next valid milestone, if exists.
 *
 * @param {GitHub} octokit Initialized Octokit REST client.
 * @param {string} owner   Repository owner.
 * @param {string} repo    Repository name.
 *
 * @return {Promise<OktokitIssuesListMilestonesForRepoResponseItem|void>} Promise resolving to milestone, if exists.
 */
async function getNextValidMilestone( octokit, owner, repo ) {
	const params = {
		state: 'open',
		sort: 'due_on',
		direction: 'asc',
	};

	const options = octokit.issues.listMilestones.endpoint.merge( {
		owner,
		repo,
		...params,
	} );

	const responses = octokit.paginate.iterator( options );

	for await ( const response of responses ) {
		// Find a milestone which name is a version number
		// and it's due dates is earliest in a future
		const nextMilestone = response.data
			.filter( m => m.title.match( /\d\.\d/ ) )
			.sort( ( m1, m2 ) => parseFloat( m1.title ) - parseFloat( m2.title ) )
			.find( milestone => milestone.due_on && moment( milestone.due_on ) > moment() );

		return nextMilestone;
	}
}

/**
 * Assigns any issues that are being worked to the author of the matching PR.
 *
 * @param {WebhookPayloadPullRequest} payload Pull request event payload.
 * @param {GitHub}                    octokit Initialized Octokit REST client.
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

	// Get next valid milestone.
	const nextMilestone = await getNextValidMilestone( octokit, owner, repo );

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
