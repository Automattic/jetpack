import { compareVersions } from 'compare-versions';
import moment from 'moment';
import type { OctokitClient } from '../types.ts';

interface Milestone {
	number: number;
	title: string;
	description?: string | null;
	due_on?: string | null;
	[ key: string ]: unknown;
}

// Cache for getOpenMilestones.
const cache: Record< string, Milestone[] > = {};

/**
 * Fetch all open milestones.
 *
 * @param octokit - Initialized Octokit REST client.
 * @param owner   - Repository owner.
 * @param repo    - Repository name.
 * @return Promise resolving to an array of all open milestones.
 */
async function getOpenMilestones(
	octokit: OctokitClient,
	owner: string,
	repo: string
): Promise< Milestone[] > {
	const milestones: Milestone[] = [];
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
 * @param octokit - Initialized Octokit REST client.
 * @param owner   - Repository owner.
 * @param repo    - Repository name.
 * @param plugin  - Plugin slug.
 * @return Promise resolving to milestone, if exists.
 */
async function getNextValidMilestone(
	octokit: OctokitClient,
	owner: string,
	repo: string,
	plugin: string = 'jetpack'
): Promise< Milestone | undefined > {
	// Find all valid milestones for the specified plugin.
	const reg = new RegExp( '^' + plugin + '\\/\\d+\\.\\d' );
	const milestones = ( await getOpenMilestones( octokit, owner, repo ) )
		.filter( m => m.title.match( reg ) )
		.filter( m => {
			/**
			 * If a milestone description contains a string with "Code Freeze: YYYY-MM-DD" or "Branch Cut: YYYY-MM-DD",
			 * and that date has elapsed, then filter out the milestone. This prevents merged PRs from being
			 * automatically added to milestones that have entered a code freeze.
			 */
			const match = m.description?.match( /(?:Code Freeze|Branch Cut): (\d{4}-\d{2}-\d{2})/ );
			return ! ( match && moment( match[ 1 ] ) < moment() );
		} )
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

export default getNextValidMilestone;
