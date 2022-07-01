const debug = require( '../../debug' );
const getLabels = require( '../../get-labels' );

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
 * Find specific plugin impacted by issue, based off issue contents.
 *
 * @param {string} body - The issue content.
 * @returns {string} Plugin concerned by issue.
 */
function findPlugin( body ) {
	const regex = /###\sImpacted\splugin\n\n(\w*)\n/gm;

	let match;
	while ( ( match = regex.exec( body ) ) ) {
		const [ , plugin ] = match;
		return plugin;
	}

	return null;
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

	// Find impacted plugin.
	const impactedPlugin = findPlugin( body );
	if ( null !== impactedPlugin ) {
		debug( `triage-new-issues: Adding plugin label to issue #${ number }` );

		await octokit.rest.issues.addLabels( {
			owner: ownerLogin,
			repo: name,
			issue_number: number,
			labels: [ `[Plugin] ${ impactedPlugin }` ],
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
