const { getInput, setFailed } = require( '@actions/core' );
const { getOctokit } = require( '@actions/github' );
const debug = require( '../../utils/debug' );
const getLabels = require( '../../utils/labels/get-labels' );
const hasPriorityLabels = require( '../../utils/labels/has-priority-labels' );
const isBug = require( '../../utils/labels/is-bug' );
const notifyImportantIssues = require( '../../utils/slack/notify-important-issues' );
const { automatticAssignments } = require( './automattic-label-team-assignments' );

/* global GitHub, WebhookPayloadIssue */

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
 * Check if an issue needs to be handled by a third-party,
 * and thus cannot be fully triaged by us.
 * In practice, we look for 2 different labels:
 * "[Status] Needs 3rd Party Fix" and "[Status] Needs Core Fix"
 *
 * It could be an existing label,
 * or it could be that it's being added as part of the event that triggers this action.
 *
 * @param {GitHub} octokit    - Initialized Octokit REST client.
 * @param {string} owner      - Repository owner.
 * @param {string} repo       - Repository name.
 * @param {string} number     - Issue number.
 * @param {string} action     - Action that triggered the event ('opened', 'reopened', 'labeled').
 * @param {object} eventLabel - Label that was added to the issue.
 * @returns {Promise<boolean>} Promise resolving to true if the issue needs a third-party fix.
 */
async function needsThirdPartyFix( octokit, owner, repo, number, action, eventLabel ) {
	const labels = await getLabels( octokit, owner, repo, number );
	if ( 'labeled' === action && eventLabel.name ) {
		labels.push( eventLabel.name );
	}

	return labels.some( label => label.match( /^\[Status\] Needs (3rd Party|Core) Fix$/ ) );
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

	// Extract the ID of the Team field.
	const teamField = projectDetails[ projectInfo.ownerType ]?.projectV2.fields.nodes.find(
		field => field.name === 'Team'
	);
	if ( teamField ) {
		projectInfo.team = teamField; // Info about our Team column (id as well as possible values).
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
		debug( `update-board: Failed to set the "${ priorityText }" priority for this project item.` );
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
 * Update the "Team" field in our project board.
 *
 * @param {GitHub} octokit       - Initialized Octokit REST client.
 * @param {object} projectInfo   - Info about our project board.
 * @param {string} projectItemId - The ID of the project item.
 * @param {string} team          - Team that should be assigned to our issue (must match an existing column in the project board).
 * @returns {Promise<string>} - The new project item id.
 */
async function setTeamField( octokit, projectInfo, projectItemId, team ) {
	const {
		projectNodeId, // Project board node ID.
		team: {
			id: teamFieldID, // ID of the status field.
			options,
		},
	} = projectInfo;

	// Find the ID of the team option that matches our issue team.
	const teamOptionId = options.find( option => option.name === team )?.id;
	if ( ! teamOptionId ) {
		debug(
			`update-board: Team "${ team }" does not exist as a column option in the project board.`
		);
		return '';
	}

	const projectNewItemDetails = await octokit.graphql(
		`mutation ( $input: UpdateProjectV2ItemFieldValueInput! ) {
			set_team: updateProjectV2ItemFieldValue( input: $input ) {
				projectV2Item {
					id
				}
			}
		}`,
		{
			input: {
				projectId: projectNodeId,
				itemId: projectItemId,
				fieldId: teamFieldID,
				value: {
					singleSelectOptionId: teamOptionId,
				},
			},
		}
	);

	const newProjectItemId = projectNewItemDetails.set_team.projectV2Item.id;
	if ( ! newProjectItemId ) {
		debug( `update-board: Failed to set the "${ team }" team for this project item.` );
		return '';
	}

	debug( `update-board: Project item ${ newProjectItemId } was assigned to the "${ team }" team.` );

	return newProjectItemId; // New Project item ID (what we just edited). String.
}

/**
 * Load a mapping of teams <> labels from a file.
 *
 * @param {string} ownerLogin - Repository owner login.
 *
 * @returns {Promise<Object>} - Mapping of teams <> labels.
 */
async function loadTeamAssignments( ownerLogin ) {
	// If we're in an Automattic repo, we can use the team assignments file that ships with this action.
	if ( 'automattic' === ownerLogin.toLowerCase() ) {
		return automatticAssignments;
	}

	const teamAssignmentsString = getInput( 'labels_team_assignments' );
	if ( ! teamAssignmentsString ) {
		debug(
			`update-board: No mapping of teams <> labels provided. Cannot automatically assign an issue to a specific team on the board. Aborting.`
		);
		return {};
	}

	const teamAssignments = JSON.parse( teamAssignmentsString );
	// Check if it is a valid object and includes information about teams and labels.
	if (
		! teamAssignments ||
		! Object.keys( teamAssignments ).length ||
		! Object.values( teamAssignments ).some( assignment => assignment.team ) ||
		! Object.values( teamAssignments ).some( assignment => assignment.labels )
	) {
		debug(
			`update-board: Invalid mapping of teams <> labels provided. Cannot automatically assign an issue to a specific team on the board. Aborting.`
		);
		return {};
	}

	return teamAssignments;
}

/**
 * Check if an issue has a label that matches a team.
 * If so, assign the issue to that team on the project board.
 * If not, do nothing.
 * It could be an existing label,
 * or it could be that it's being added as part of the event that triggers this action.
 *
 * @param {GitHub} octokit    - Initialized Octokit REST client.
 * @param {object} payload    - Issue event payload.
 * @param {object} projectInfo - Info about our project board.
 * @param {string} projectItemId - The ID of the project item.
 * @param {Array} priorityLabels - Array of priority labels.
 * @returns {Promise<string>} - The new project item id.
 */
async function assignTeam( octokit, payload, projectInfo, projectItemId, priorityLabels ) {
	const {
		action,
		issue: { number, node_id },
		label = {},
		repository: { owner, name },
	} = payload;
	const ownerLogin = owner.login;

	const teamAssignments = await loadTeamAssignments( ownerLogin );
	if ( ! teamAssignments ) {
		debug(
			`update-board: No mapping of teams <> labels provided. Cannot automatically assign an issue to a specific team on the board. Aborting.`
		);
		return projectItemId;
	}

	// Get the list of labels associated with this issue.
	const labels = await getLabels( octokit, ownerLogin, name, number );
	if ( 'labeled' === action && label.name ) {
		labels.push( label.name );
	}

	// Check if any of the labels on this issue match a team.
	// Loop through all the mappings in team assignments,
	// and find the first one that includes a label that matches one present in the issue.
	const [ featureName, { team, slack_id, board_id } = {} ] =
		Object.entries( teamAssignments ).find( ( [ , assignment ] ) =>
			labels.some( mappedLabel => assignment.labels.includes( mappedLabel ) )
		) || [];

	if ( ! team ) {
		debug(
			`update-board: Issue #${ number } does not have a label that matches a team. Aborting.`
		);
		return projectItemId;
	}

	// Set the status field for this project item.
	debug(
		`update-board: Assigning the "${ team }" team for this project item, issue #${ number }.`
	);
	projectItemId = await setTeamField( octokit, projectInfo, projectItemId, team );

	// Does the team want to be notified in Slack about high/blocker priority issues?
	if ( slack_id && priorityLabels.length > 0 ) {
		debug(
			`update-board: Issue #${ number } has the following priority labels: ${ priorityLabels.join(
				', '
			) }. The ${ team } team is interested in getting Slack updates for important issues. Let’s notify them.`
		);
		await notifyImportantIssues( octokit, payload, slack_id );
	}

	// Does the team have a Project board where they track work for this feature? We can add the issue to that board.
	if ( board_id ) {
		debug(
			`update-board: Issue #${ number } is associated with the "${ featureName }" feature, and the ${ team } team has a dedicated project board for this feature. Let’s add the issue to that board.`
		);

		// Get details about our project board, to use in our requests.
		const featureProjectInfo = await getProjectDetails( octokit, board_id );
		if ( Object.keys( featureProjectInfo ).length === 0 || ! featureProjectInfo.projectNodeId ) {
			setFailed(
				`update-board: we cannot fetch info about the project board associated to the "${ featureName }" feature. Aborting task.`
			);
			return projectItemId;
		}

		// Check if the issue is already on the project board. If so, return its ID on the board.
		let featureIssueItemId = await getIssueProjectItemId(
			octokit,
			featureProjectInfo,
			name,
			number
		);
		if ( ! featureIssueItemId ) {
			debug( `update-board: Issue #${ number } is not on our project board. Let’s add it.` );

			featureIssueItemId = await addIssueToBoard( octokit, featureProjectInfo, node_id );
			if ( ! featureIssueItemId ) {
				debug( `update-board: Failed to add issue to project board. Aborting.` );
				return projectItemId;
			}
		}
	}

	return projectItemId;
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
		projectItemId = await setStatusField(
			projectOctokit,
			projectInfo,
			projectItemId,
			'Needs Triage'
		);
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
		projectItemId = await setPriorityField(
			projectOctokit,
			projectInfo,
			projectItemId,
			priorityText
		);
	}

	// Check if the issue has a "Triaged" label.
	const hasTriaged = await hasTriagedLabel( octokit, ownerLogin, name, number, action, label );
	if ( hasTriaged ) {
		// Check if the issue depends on a third-party.
		const needsThirdParty = await needsThirdPartyFix(
			octokit,
			ownerLogin,
			name,
			number,
			action,
			label
		);
		if ( needsThirdParty ) {
			// Let's update the status field to "Needs Core/3rd Party Fix" instead of "Triaged".
			debug(
				`update-board: Issue #${ number } needs a third-party fix. Setting the "Needs Core/3rd Party Fix" status for this project item.`
			);
			await setStatusField(
				projectOctokit,
				projectInfo,
				projectItemId,
				'Needs Core/3rd Party Fix'
			);
			return;
		}

		// Set the status field for this project item.
		debug(
			`update-board: Setting the "Triaged" status for this project item, issue #${ number }.`
		);
		await setStatusField( projectOctokit, projectInfo, projectItemId, 'Triaged' );
	}

	// Try to assign the issue to a specific team, if we have a mapping of teams <> labels and a matching label on the issue.
	// When assigning, we can also do more to warn the team about the issue, if we have additional info (Slack, project board).
	projectItemId = await assignTeam(
		projectOctokit,
		payload,
		projectInfo,
		projectItemId,
		priorityLabels
	);
}
module.exports = updateBoard;
