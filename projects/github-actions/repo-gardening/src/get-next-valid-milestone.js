/**
 * External dependencies
 */
const moment = require( 'moment' );
const compareVersions = require( 'compare-versions' );

/* global GitHub, OktokitIssuesListMilestonesForRepoResponseItem */

/**
 * Returns a promise resolving to the next valid milestone, if exists.
 *
 * @param {GitHub} octokit - Initialized Octokit REST client.
 * @param {string} owner   - Repository owner.
 * @param {string} repo    - Repository name.
 * @param {string} plugin  - Plugin slug.
 *
 * @returns {Promise<OktokitIssuesListMilestonesForRepoResponseItem|void>} Promise resolving to milestone, if exists.
 */
async function getNextValidMilestone( octokit, owner, repo, plugin = 'jetpack' ) {
	const options = octokit.issues.listMilestones.endpoint.merge( {
		owner,
		repo,
		state: 'open',
		sort: 'due_on',
		direction: 'asc',
	} );

	const responses = octokit.paginate.iterator( options );

	for await ( const response of responses ) {
		// Find all valid milestones for the specified plugin.
		const reg = new RegExp( '^' + plugin + '\\/\\d+\\.\\d' );
		const milestones = response.data
			.filter( m => m.title.match( reg ) )
			.sort( ( m1, m2 ) =>
				compareVersions( m1.title.split( '/' )[ 1 ], m2.title.split( '/' )[ 1 ] )
			);

		// Return the first milestone with a future due date,
		// or failing that the first milestone with no due date.
		return (
			milestones.find( milestone => milestone.due_on && moment( milestone.due_on ) > moment() ) ||
			milestones.find( milestone => ! milestone.due_on )
		);
	}
}

module.exports = getNextValidMilestone;
