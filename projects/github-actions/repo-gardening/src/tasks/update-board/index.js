const { getInput, setFailed } = require( '@actions/core' );
const { getOctokit } = require( '@actions/github' );
const debug = require( '../../utils/debug' );
const getLabels = require( '../../utils/get-labels' );

/* global GitHub, WebhookPayloadIssue */

/**
 * Check for Priority labels on an issue.
 * It could be existing labels,
 * or it could be that it's being added as part of the event that triggers this action.
 *
 * @param {GitHub} octokit    - Initialized Octokit REST client.
 * @param {string} owner      - Repository owner.
 * @param {string} repo       - Repository name.
 * @param {string} number     - Issue number.
 * @param {string} action     - Action that triggered the event ('opened', 'reopened', 'labeled').
 * @param {object} eventLabel - Label that was added to the issue.
 * @returns {Promise<Array>} Promise resolving to an array of Priority labels.
 */
async function hasPriorityLabels( octokit, owner, repo, number, action, eventLabel ) {
	const labels = await getLabels( octokit, owner, repo, number );
	if ( 'labeled' === action && eventLabel.name && eventLabel.name.match( /^\[Pri\].*$/ ) ) {
		labels.push( eventLabel.name );
	}

	return labels.filter( label => label.match( /^\[Pri\].*$/ ) && label !== '[Pri] TBD' );
}

/**
 * Check if an issue has a "Triaged" label.
 * It could be an existing label,
 * or it could be that it's being added as part of the event that triggers this action.
 *
 * @param {GitHub} octokit    - Initialized Octokit REST client.
 * @param {string} owner      - Repository owner.
 * @param {string} repo       - Repository name.
 * @param {string} number     - Issue number.
 * @param {string} action     - Action that triggered the event ('opened', 'reopened', 'labeled').
 * @param {object} eventLabel - Label that was added to the issue.
 * @returns {Promise<boolean>} Promise resolving to true if the issue has a "Triaged" label.
 */
async function hasTriagedLabel( octokit, owner, repo, number, action, eventLabel ) {
	const labels = await getLabels( octokit, owner, repo, number );
	if ( 'labeled' === action && eventLabel.name && eventLabel.name === 'Triaged' ) {
		labels.push( eventLabel.name );
	}

	return labels.includes( 'Triaged' );
}

/**
 * Ensure the issue is a bug, by looking for a "[Type] Bug" label.
 * It could be an existing label,
 * or it could be that it's being added as part of the event that triggers this action.
 *
 * @param {GitHub} octokit    - Initialized Octokit REST client.
 * @param {string} owner      - Repository owner.
 * @param {string} repo       - Repository name.
 * @param {string} number     - Issue number.
 * @param {string} action     - Action that triggered the event ('opened', 'reopened', 'labeled').
 * @param {object} eventLabel - Label that was added to the issue.
 * @returns {Promise<boolean>} Promise resolving to boolean.
 */
async function isBug( octokit, owner, repo, number, action, eventLabel ) {
	// If the issue has a "[Type] Bug" label, it's a bug.
	const labels = await getLabels( octokit, owner, repo, number );
	if ( labels.includes( '[Type] Bug' ) ) {
		return true;
	}

	// Next, check if the current event was a [Type] Bug label being added.
	if ( 'labeled' === action && eventLabel.name && '[Type] Bug' === eventLabel.name ) {
		return true;
	}
}

/**
 * Get Information about a project board.
 *
 * @param {GitHub} octokit          - Initialized Octokit REST client.
 * @param {string} projectBoardLink - The link to the project board.
 * @returns {Promise<Object>} - Project board information.
 */
async function getProjectDetails( octokit, projectBoardLink ) {
	const projectRegex =
		/^(?:https:\/\/)?github\.com\/(?<ownerType>orgs|users)\/(?<ownerName>[^/]+)\/projects\/(?<projectNumber>\d+)/;
	const matches = projectBoardLink.match( projectRegex );
	if ( ! matches ) {
		debug( `update-board: Invalid project board link provided. Cannot triage to a board` );
		return {};
	}

	const {
		groups: { ownerType, ownerName, projectNumber },
	} = matches;

	const projectInfo = {
		ownerType: ownerType === 'orgs' ? 'organization' : 'user', // GitHub API requests require 'organization' or 'user'.
		ownerName,
		projectNumber: parseInt( projectNumber, 10 ),
	};

	debug( `update-board: Fetching info about project board.` );

	// First, use the GraphQL API to request the project's node ID,
	// as well as info about the first 20 fields for that project.
	const projectDetails = await octokit.graphql(
		`query getProject($ownerName: String!, $projectNumber: Int!) {
			${ projectInfo.ownerType }(login: $ownerName) {
				projectV2(number: $projectNumber) {
					id
					fields(first:20) {
						nodes {
							... on ProjectV2Field {
								id
								name
							}
							... on ProjectV2SingleSelectField {
								id
								name
								options {
									id
									name
								}
							}
						}
					}
				}
			}
		}`,
		{
			ownerName: projectInfo.ownerName,
			projectNumber: projectInfo.projectNumber,
		}
	);

	// Extract the project node ID.
	const projectNodeId = projectDetails[ projectInfo.ownerType ]?.projectV2.id;
	if ( projectNodeId ) {
		projectInfo.projectNodeId = projectNodeId; // Project board node ID. String.
	}

	// Extract the ID of the Priority field.
	const priorityField = projectDetails[ projectInfo.ownerType ]?.projectV2.fields.nodes.find(
		field => field.name === 'Priority'
	);
	if ( priorityField ) {
		projectInfo.priority = priorityField; // Info about our Priority column (id as well as possible values).
	}

	// Extract the ID of the Status field.
	const statusField = projectDetails[ projectInfo.ownerType ]?.projectV2.fields.nodes.find(
		field => field.name === 'Status'
	);
	if ( statusField ) {
		projectInfo.status = statusField; // Info about our Status column (id as well as possible values).
	}

	return projectInfo;
}

/**
 * Check if an issue is on our project board.
 * If it is, return the ID of the project item.
 *
 * @param {GitHub} octokit     - Initialized Octokit REST client.
 * @param {object} projectInfo - Info about our project board.
 * @param {string} repoName    - The name of the repository.
 * @param {string} issueId     - The ID of the issue.
 * @returns {Promise<string>}  - The ID of the project item, or an empty string if not found.
 */
async function getIssueProjectItemId( octokit, projectInfo, repoName, issueId ) {
	const { ownerName, projectNumber } = projectInfo;

	// First, use the GraphQL API to request the project item IDs for each of the boards this issue belongs to.
	const projectItemDetails = await octokit.graphql(
		`query getProjectItems($ownerName: String!, $repoName: String!, $issueId: Int!) {
			repository( owner: $ownerName, name: $repoName ) {
				issue( number: $issueId ) {
					projectItems( first: 20 ) {
						... on ProjectV2ItemConnection {
							nodes {
								... on ProjectV2Item {
									id,
									project {
										number
									}
								}
							}
						}
					}
				}
			}
		}`,
		{
			ownerName,
			repoName,
			issueId,
		}
	);

	// Only keep the project item ID for the project board we're interested in.
	const projectItemId = projectItemDetails.repository.issue.projectItems.nodes.find(
		item => item.project.number === projectNumber
	)?.id;

	return projectItemId || '';
}

/**
 * Add Issue to our project board.
 *
 * @param {GitHub} octokit     - Initialized Octokit REST client.
 * @param {object} projectInfo - Info about our project board.
 * @param {string} node_id     - The node_id of the Issue.
 * @returns {Promise<string>} - Info about the project item id that was created.
 */
async function addIssueToBoard( octokit, projectInfo, node_id ) {
	const { projectNodeId } = projectInfo;

	// Add our PR to that project board.
	const projectItemDetails = await octokit.graphql(
		`mutation addIssueToProject($input: AddProjectV2ItemByIdInput!) {
			addProjectV2ItemById(input: $input) {
				item {
					id
				}
			}
		}`,
		{
			input: {
				projectId: projectNodeId,
				contentId: node_id,
			},
		}
	);

	const projectItemId = projectItemDetails.addProjectV2ItemById.item.id;
	if ( ! projectItemId ) {
		debug( `update-board: Failed to add issue to project board.` );
		return '';
	}

	debug( `update-board: Added issue to project board.` );

	return projectItemId;
}

/**
 * Set custom priority field for a project item.
 *
 * @param {GitHub} octokit       - Initialized Octokit REST client.
 * @param {object} projectInfo   - Info about our project board.
 * @param {string} projectItemId - The ID of the project item.
 * @param {string} priorityText  - Priority of our issue (must match an existing column in the project board).
 * @returns {Promise<string>} - The new project item id.
 */
async function setPriorityField( octokit, projectInfo, projectItemId, priorityText ) {
	const {
		projectNodeId, // Project board node ID.
		priority: {
			id: priorityFieldId, // ID of the priority field.
			options,
		},
	} = projectInfo;

	// Find the ID of the priority option that matches our PR priority.
	const priorityOptionId = options.find( option => option.name === priorityText )?.id;
	if ( ! priorityOptionId ) {
		debug(
			`update-board: Priority ${ priorityText } does not exist as a column option in the project board.`
		);
		return '';
	}

	const projectNewItemDetails = await octokit.graphql(
		`mutation ( $input: UpdateProjectV2ItemFieldValueInput! ) {
			set_priority: updateProjectV2ItemFieldValue( input: $input ) {
				projectV2Item {
					id
				}
			}
		}`,
		{
			input: {
				projectId: projectNodeId,
				itemId: projectItemId,
				fieldId: priorityFieldId,
				value: {
					singleSelectOptionId: priorityOptionId,
				},
			},
		}
	);

	const newProjectItemId = projectNewItemDetails.set_priority.projectV2Item.id;
	if ( ! newProjectItemId ) {
		debug( `update-board: Failed to set the "${ priorityText }" status for this project item.` );
		return '';
	}

	debug(
		`update-board: Project item ${ newProjectItemId } was moved to "${ priorityText }" priority.`
	);

	return newProjectItemId; // New Project item ID (what we just edited). String.
}

/**
 * Update the "Status" field in our project board.
 *
 * @param {GitHub} octokit       - Initialized Octokit REST client.
 * @param {object} projectInfo   - Info about our project board.
 * @param {string} projectItemId - The ID of the project item.
 * @param {string} statusText    - Status of our issue (must match an existing column in the project board).
 * @returns {Promise<string>} - The new project item id.
 */
async function setStatusField( octokit, projectInfo, projectItemId, statusText ) {
	const {
		projectNodeId, // Project board node ID.
		status: {
			id: statusFieldId, // ID of the status field.
			options,
		},
	} = projectInfo;

	// Find the ID of the status option that matches our issue status.
	const statusOptionId = options.find( option => option.name === statusText )?.id;
	if ( ! statusOptionId ) {
		debug(
			`update-board: Status ${ statusText } does not exist as a column option in the project board.`
		);
		return '';
	}

	const projectNewItemDetails = await octokit.graphql(
		`mutation ( $input: UpdateProjectV2ItemFieldValueInput! ) {
			set_status: updateProjectV2ItemFieldValue( input: $input ) {
				projectV2Item {
					id
				}
			}
		}`,
		{
			input: {
				projectId: projectNodeId,
				itemId: projectItemId,
				fieldId: statusFieldId,
				value: {
					singleSelectOptionId: statusOptionId,
				},
			},
		}
	);

	const newProjectItemId = projectNewItemDetails.set_status.projectV2Item.id;
	if ( ! newProjectItemId ) {
		debug( `update-board: Failed to set the "${ statusText }" status for this project item.` );
		return '';
	}

	debug(
		`update-board: Project item ${ newProjectItemId } was moved to "${ statusText }" status.`
	);

	return newProjectItemId; // New Project item ID (what we just edited). String.
}

/**
 * Automatically update specific columns in our common GitHub project board,
 * to match labels applied to issues.
 *
 * @param {WebhookPayloadIssue} payload - Issue event payload.
 * @param {GitHub}              octokit - Initialized Octokit REST client.
 */
async function updateBoard( payload, octokit ) {
	const { action, issue, label = {}, repository } = payload;
	const { number, node_id, state } = issue;
	const { owner, name } = repository;
	const ownerLogin = owner.login;

	// Do not run this task if the issue is not open.
	if ( 'open' !== state ) {
		debug(
			`update-board: Issue #${ number } is not open. No need to update its status on the board.`
		);
		return;
	}

	const projectToken = getInput( 'triage_projects_token' );
	if ( ! projectToken ) {
		setFailed( `update-board: Input triage_projects_token is required but missing. Aborting.` );
		return;
	}

	const projectBoardLink = getInput( 'project_board_url' );
	if ( ! projectBoardLink ) {
		setFailed(
			`update-board: No project board link provided. Cannot triage to a board. Aborting.`
		);
		return;
	}

	// For this task, we need octokit to have extra permissions not provided by the default GitHub token.
	// Let's create a new octokit instance using our own custom token.
	// eslint-disable-next-line new-cap
	const projectOctokit = new getOctokit( projectToken );

	// Get details about our project board, to use in our requests.
	const projectInfo = await getProjectDetails( projectOctokit, projectBoardLink );
	if ( Object.keys( projectInfo ).length === 0 || ! projectInfo.projectNodeId ) {
		setFailed( `update-board: we cannot fetch info about our project board. Aborting task.` );
		return;
	}

	// Check if the issue is already on the project board. If so, return its ID on the board.
	let projectItemId = await getIssueProjectItemId( projectOctokit, projectInfo, name, number );
	if ( ! projectItemId ) {
		debug(
			`update-board: Issue #${ number } is not on our project board. Let's check if it is a bug. If it is, we will want to add it to our board.`
		);

		// If the issue is not a bug, stop.
		const isBugIssue = await isBug( octokit, ownerLogin, name, number, action, label );
		if ( ! isBugIssue ) {
			debug( `update-board: Issue #${ number } is not classified as a bug. Aborting.` );
			return;
		}

		// If the issue is a bug, add it to our project board.
		debug( `update-board: Issue #${ number } is a bug. Adding it to our project board.` );
		projectItemId = await addIssueToBoard( projectOctokit, projectInfo, node_id );
		if ( ! projectItemId ) {
			debug( `update-board: Failed to add issue to project board. Aborting.` );
			return;
		}

		// Set the "Needs Triage" status for our issue on the board.
		debug(
			`update-board: Setting the "Needs Triage" status for this project item, issue #${ number }.`
		);
		await setStatusField( projectOctokit, projectInfo, projectItemId, 'Needs Triage' );
	}

	// Check if priority needs to be updated for that issue.
	const priorityLabels = await hasPriorityLabels(
		octokit,
		ownerLogin,
		name,
		number,
		action,
		label
	);
	if ( priorityLabels.length > 0 ) {
		debug(
			`update-board: Issue #${ number } has the following priority labels: ${ priorityLabels.join(
				', '
			) }`
		);

		// If we have no info about the Priority column, stop.
		if ( ! projectInfo.priority ) {
			debug( `update-board: No priority column found in project board. Aborting.` );
			return;
		}

		// Remove the "[Pri]" prefix from our priority labels. We also only need one label.
		const priorityText = priorityLabels[ 0 ].replace( /^\[Pri\]\s*/, '' );

		// Set the priority field for this project item.
		debug(
			`update-board: Setting the "${ priorityText }" priority for this project item, issue #${ number }.`
		);
		await setPriorityField( projectOctokit, projectInfo, projectItemId, priorityText );
	}

	// Check if the issue has a "Triaged" label.
	const hasTriaged = await hasTriagedLabel( octokit, ownerLogin, name, number, action, label );
	if ( hasTriaged ) {
		// Set the status field for this project item.
		debug(
			`update-board: Setting the "Triaged" status for this project item, issue #${ number }.`
		);
		await setStatusField( projectOctokit, projectInfo, projectItemId, 'Triaged' );
	}
}
module.exports = updateBoard;
