/**
 * External dependencies
 */
const { setFailed, getInput } = require( '@actions/core' );
const { context, GitHub } = require( '@actions/github' );

async function run() {
	const token = getInput( 'token' );
	if ( ! token ) {
		setFailed( 'main: Input `token` is required' );
		return;
	}

	const octokit = new GitHub( token );

	// Get info about the event.
	const eventPayload = context.payload;

	// Look for words indicating that a PR fixes an issue.
	const regex = /(?:close|closes|closed|fix|fixes|fixed|resolve|resolves|resolved):? +(?:\#?|https?:\/\/github\.com\/automattic\/jetpack\/issues\/)(\d+)/gi;

	let match;
	while ( ( match = regex.exec( eventPayload.pull_request.body ) ) ) {
		const [ , issue ] = match;
		console.log( `We have a match. The issue ID is ${ issue }` );

		// Assign the issue to the PR author.
		await octokit.issues.addAssignees( {
			owner: eventPayload.repository.owner.login,
			repo: eventPayload.repository.name,
			issue_number: +issue,
			assignees: [ eventPayload.pull_request.user.login ],
		} );

		// Add the In Progress label to the issue.
		await octokit.issues.addLabels( {
			owner: eventPayload.repository.owner.login,
			repo: eventPayload.repository.name,
			issue_number: +issue,
			labels: [ '[Status] In Progress' ],
		} );
	}
}

run();
