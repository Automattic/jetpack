const compareVersions = require( 'compare-versions' );
const moment = require( 'moment' );

/* global GitHub, OktokitIssuesListMilestonesForRepoResponseItem */

// Cache for getOpenMilestones.
const cache = {};

/**
 * Fetch all open milestones.
 *
 * @param {GitHub} octokit - Initialized Octokit REST client.
 * @param {string} owner   - Repository owner.
 * @param {string} repo    - Repository name.
 * @returns {Promise<Array>} Promise resolving to an array of all open milestones.
 */
async function getOpenMilestones( octokit, owner, repo ) {
	const milestones = [];
	const cacheKey = `${ owner }/${ repo }`;
	if ( cache[ cacheKey ] ) {
		return cache[ cacheKey ];
	}

	for await ( const response of octokit.paginate.iterator( octokit.rest.issues.listMilestones, {
		owner,
		repo,
		state: 'open',
		sort: 'due_on',
		direction: 'asc',
		per_page: 100,
	} ) ) {
		for ( const milestone of response.data ) {
			milestones.push( milestone );
		}
	}

	cache[ cacheKey ] = milestones;
	return milestones;
}

/**
 * Returns a promise resolving to the next valid milestone, if exists.
 *
 * @param {GitHub} octokit - Initialized Octokit REST client.
 * @param {string} owner   - Repository owner.
 * @param {string} repo    - Repository name.
 * @param {string} plugin  - Plugin slug.
 * @returns {Promise<OktokitIssuesListMilestonesForRepoResponseItem|void>} Promise resolving to milestone, if exists.
 */
async function getNextValidMilestone( octokit, owner, repo, plugin = 'jetpack' ) {
	// Find all valid milestones for the specified plugin.
	const reg = new RegExp( '^' + plugin + '\\/\\d+\\.\\d' );
	const milestones = ( await getOpenMilestones( octokit, owner, repo ) )
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

module.exports = getNextValidMilestone;
