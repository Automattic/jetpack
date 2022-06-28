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
 * Find priority of issue, based off issue contents.
 *
 * @param {string} body - The issue content.
 * @returns {string} Priority of issue.
 */
function findPriority( body ) {
	const regex = /###\sSeverity\n\n(.*)\n/gm;

	let match;
	while ( ( match = regex.exec( body ) ) ) {
		const [ , severity ] = match;

		switch ( severity ) {
			case 'All':
				return 'High';
			case 'Some (< 50%)':
				return 'High';
			case 'Most (> 50%)':
				return 'Normal';
			case 'One':
				return 'Low';
			default:
				// This includes the "_No response_" case, where one does not fill in the severity field.
				return null;
		}
	}

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
