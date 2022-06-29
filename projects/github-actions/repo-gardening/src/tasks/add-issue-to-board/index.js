const { getInput, setFailed } = require( '@actions/core' );
const { getOctokit } = require( '@actions/github' );
const debug = require( '../../debug' );
const getLabels = require( '../../get-labels' );

/* global GitHub, WebhookPayloadIssue */

/**
 * Check for block-related label on an issue.
 *
 * @param {GitHub} octokit - Initialized Octokit REST client.
 * @param {string} owner   - Repository owner.
 * @param {string} repo    - Repository name.
 * @param {string} number  - Issue number.
 * @returns {Promise<boolean>} Promise resolving to boolean.
 */
async function hasBlockLabel( octokit, owner, repo, number ) {
	const labels = await getLabels( octokit, owner, repo, number );

	// We're only interested in the labels related to blocks (or "extensions").
	const blockLabelIndicators = [ '[Block]', '[Extension]', 'Gutenberg' ];

	const hasLabel = labels.filter( label =>
		blockLabelIndicators.some( indicator => label.includes( indicator ) )
	);

	if ( ! hasLabel.length ) {
		debug( 'add-issue-to-board: This issue does not have block labels.' );
		return false;
	}

	return true;
}

/**
 * Add an issue to a specific GitHub project board if necessary.
 *
 * @param {WebhookPayloadIssue} payload - Issue event payload.
 * @param {GitHub}              octokit - Initialized Octokit REST client.
 */
async function addIssueToBoard( payload, octokit ) {
	const { issue, repository } = payload;
	const { number, node_id } = issue;
	const { owner, name } = repository;
	const ownerLogin = owner.login;

	const projectToken = getInput( 'project_automation_token' );
	if ( ! projectToken ) {
		setFailed(
			`add-issue-to-board: Input project_automation_token is required but missing. Aborting.`
		);
		return;
	}

	// Check if the issue has a block-related label.
	const touchesBlocks = await hasBlockLabel( octokit, ownerLogin, name, number );

	// ID of the board used to triage block-related issues.
	const blockProjectId = getInput( 'project_automation_block_project' );

	if ( true === touchesBlocks && blockProjectId ) {
		debug(
			`add-issue-to-board: Block-related issue. Adding #${ number } to project #${ blockProjectId }`
		);

		// For this task, we need octokit to have extra permissions not provided by the default GitHub token.
		// Let's create a new octokit instance using our own custom token.
		// eslint-disable-next-line new-cap
		const projectOctokit = new getOctokit( projectToken );

		// Use the GraphQL API to request the project's details.
		const projectDetails = await projectOctokit.graphql(
			`query getProject($ownerName: String!, $projectNumber: Int!) {
				organization(login: $ownerName) {
					projectV2(number: $projectNumber) {
						id
					}
				}
			}`,
			{
				ownerName: ownerLogin,
				projectNumber: parseInt( blockProjectId, 10 ),
			}
		);

		// Get project board id.
		const blockProjectNodeId = projectDetails.organization?.projectV2.id;

		// Add issue to project board.
		await projectOctokit.graphql(
			`mutation addIssueToProject($input: AddProjectV2ItemByIdInput!) {
				addProjectV2ItemById(input: $input) {
					item {
						id
					}
				}
			}`,
			{
				input: {
					projectId: blockProjectNodeId,
					contentId: node_id,
				},
			}
		);
	}
}

module.exports = addIssueToBoard;
