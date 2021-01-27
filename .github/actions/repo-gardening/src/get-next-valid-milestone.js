/**
 * External dependencies
 */
const moment = require( 'moment' );

/* global GitHub, OktokitIssuesListMilestonesForRepoResponseItem */

/**
 * Returns a promise resolving to the next valid milestone, if exists.
 *
 * @param {GitHub} octokit - Initialized Octokit REST client.
 * @param {string} owner   - Repository owner.
 * @param {string} repo    - Repository name.
 *
 * @returns {Promise<OktokitIssuesListMilestonesForRepoResponseItem|void>} Promise resolving to milestone, if exists.
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

module.exports = getNextValidMilestone;
