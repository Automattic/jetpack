const debug = require( '../../debug' );

/* global GitHub, WebhookPayloadIssue */

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
		} else if ( blocking !== '' ) {
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

	// Find impacted plugin.
	const impactedPlugin = findPlugin( body );
	if ( null !== impactedPlugin ) {
		debug( `triage-new-issues: Adding plugin label to issue #${ number }` );

		await octokit.rest.issues.addLabels( {
			owner: owner.login,
			repo: name,
			issue_number: number,
			labels: [ `[Plugin] ${ impactedPlugin }` ],
		} );
	}

	// Find Priority.
	debug( `triage-new-issues: Finding priority for issue #${ number }` );
	const priority = findPriority( body );
	if ( null !== priority ) {
		debug( `triage-new-issues: Adding priority label to issue #${ number }` );

		await octokit.rest.issues.addLabels( {
			owner: owner.login,
			repo: name,
			issue_number: number,
			labels: [ `[Pri] ${ priority }` ],
		} );
	}
}

module.exports = triageNewIssues;
