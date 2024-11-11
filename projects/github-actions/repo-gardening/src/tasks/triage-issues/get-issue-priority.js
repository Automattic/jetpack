const debug = require( '../../utils/debug' );
const getLabels = require( '../../utils/labels/get-labels' );
const findPriority = require( '../../utils/parse-content/find-priority' );

/* global GitHub, WebhookPayloadIssue */

/**
 * Try to figure out the priority of the issue based off its contents and existing labels.
 *
 * @param {WebhookPayloadIssue} payload - Issue event payload.
 * @param {GitHub}              octokit - Initialized Octokit REST client.
 *
 * @return {Promise<Array>} Promise resolving to an array of Priority Labels matching this issue.
 */
async function getIssuePriority( payload, octokit ) {
	const {
		issue: { number, body },
		repository: {
			owner: { login: ownerLogin },
			name,
		},
	} = payload;

	const labels = await getLabels( octokit, ownerLogin, name, number );
	const priorityLabels = labels.filter(
		label => label.match( /^\[Pri\].*$/ ) && label !== '[Pri] TBD'
	);
	if ( priorityLabels.length > 0 ) {
		debug(
			`triage-issues > issue priority: Issue #${ number } has the following priority labels: ${ priorityLabels.join(
				', '
			) }`
		);
		return priorityLabels;
	}

	// If the issue does not have Priority labels yet, let's try to infer one from the issue contents.
	debug(
		`triage-issues > issue priority: Finding priority for issue #${ number } based off the issue contents.`
	);
	const priority = findPriority( body );
	debug(
		`triage-issues > issue priority: Priority inferred from the issue contents for issue #${ number } is ${ priority }`
	);

	return [ `[Pri] ${ priority }` ];
}

module.exports = getIssuePriority;
