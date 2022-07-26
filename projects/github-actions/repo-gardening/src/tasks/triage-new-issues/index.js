const debug = require( '../../utils/debug' );
const getLabels = require( '../../utils/get-labels' );

/* global GitHub, WebhookPayloadIssue */

/**
 * Check for Priority label on an issue
 *
 * @param {GitHub} octokit - Initialized Octokit REST client.
 * @param {string} owner   - Repository owner.
 * @param {string} repo    - Repository name.
 * @param {string} number  - Issue number.
 * @returns {Promise<boolean>} Promise resolving to boolean.
 */
async function hasPriorityLabels( octokit, owner, repo, number ) {
	const labels = await getLabels( octokit, owner, repo, number );
	// We're only interested in priority labels.
	return !! labels.find( label => label.match( /^\[Pri\].*$/ ) );
}

/**
 * Find list of plugins impacted by issue, based off issue contents.
 *
 * @param {string} body - The issue content.
 * @returns {Array} Plugins concerned by issue.
 */
function findPlugins( body ) {
	const regex = /###\sImpacted\splugin\n\n([a-zA-Z ,]*)\n\n/gm;

	const match = regex.exec( body );
	if ( match ) {
		const [ , plugins ] = match;
		return plugins.split( ', ' ).filter( v => v.trim() !== '' );
	}

	debug( `triage-new-issues: No plugin indicators found.` );
	return [];
}

/**
 * Find platform info, based off issue contents.
 *
 * @param {string} body - The issue content.
 * @returns {Array} Platforms impacted by issue.
 */
function findPlatforms( body ) {
	const regex = /###\sPlatform\s\(Simple,\sAtomic,\sor\sboth\?\)\n\n([a-zA-Z ,-]*)\n\n/gm;

	const match = regex.exec( body );
	if ( match ) {
		const [ , platforms ] = match;
		return platforms
			.split( ', ' )
			.filter( platform => platform !== 'Self-hosted' && platform.trim() !== '' );
	}

	debug( `triage-new-issues: no platform indicators found.` );
	return [];
}

/**
 * Figure out the priority of the issue, based off issue contents.
 * Logic follows this priority matrix: pciE2j-oG-p2
 *
 * @param {string} body - The issue content.
 * @returns {string} Priority of issue.
 */
function findPriority( body ) {
	// Look for priority indicators in body.
	const priorityRegex = /###\sSeverity\n\n(?<severity>.*)\n\n###\sAvailable\sworkarounds\?\n\n(?<blocking>.*)\n/gm;
	let match;
	while ( ( match = priorityRegex.exec( body ) ) ) {
		const [ , severity = '', blocking = '' ] = match;

		debug(
			`triage-new-issues: Reported priority indicators for issue: "${ severity }" / "${ blocking }"`
		);

		if ( blocking === 'No and the platform is unusable' ) {
			return severity === 'One' ? 'High' : 'BLOCKER';
		} else if ( blocking === 'No but the platform is still usable' ) {
			return 'High';
		} else if ( blocking === 'Yes, difficult to implement' ) {
			return severity === 'All' ? 'High' : 'Normal';
		} else if ( blocking !== '' && blocking !== '_No response_' ) {
			return severity === 'All' || severity === 'Most (> 50%)' ? 'Normal' : 'Low';
		}
		return null;
	}

	debug( `triage-new-issues: No priority indicators found.` );
	return null;
}

/**
 * Add labels to newly opened issues.
 *
 * @param {WebhookPayloadIssue} payload - Issue event payload.
 * @param {GitHub}              octokit - Initialized Octokit REST client.
 */
async function triageNewIssues( payload, octokit ) {
	const { issue, repository } = payload;
	const { number, body } = issue;
	const { owner, name } = repository;
	const ownerLogin = owner.login;

	// Find impacted plugins.
	const impactedPlugins = findPlugins( body );
	if ( impactedPlugins.length > 0 ) {
		debug( `triage-new-issues: Adding plugin labels to issue #${ number }` );

		const pluginLabels = impactedPlugins.map( plugin => `[Plugin] ${ plugin }` );

		await octokit.rest.issues.addLabels( {
			owner: ownerLogin,
			repo: name,
			issue_number: number,
			labels: pluginLabels,
		} );
	}

	// Find platform info.
	const impactedPlatforms = findPlatforms( body );
	if ( impactedPlatforms.length > 0 ) {
		debug( `triage-new-issues: Adding platform labels to issue #${ number }` );

		const platformLabels = impactedPlatforms.map( platform => `[Platform] ${ platform }` );

		await octokit.rest.issues.addLabels( {
			owner: ownerLogin,
			repo: name,
			issue_number: number,
			labels: platformLabels,
		} );
	}

	// Find Priority.
	debug( `triage-new-issues: Finding priority for issue #${ number }` );
	const priority = findPriority( body );
	const hasPriorityLabel = await hasPriorityLabels( octokit, ownerLogin, name, number );
	if ( priority !== null && ! hasPriorityLabel ) {
		debug( `triage-new-issues: Adding priority label to issue #${ number }` );

		await octokit.rest.issues.addLabels( {
			owner: ownerLogin,
			repo: name,
			issue_number: number,
			labels: [ `[Pri] ${ priority }` ],
		} );
	}
}

module.exports = triageNewIssues;
