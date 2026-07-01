import { getInput, setFailed } from '@actions/core';
import { getOctokit } from '@actions/github';
import debug from '../../utils/debug.ts';
import getLabels from '../../utils/labels/get-labels.ts';
import notifyImportantIssues from '../../utils/slack/notify-important-issues.ts';
import { automatticAssignments } from './automattic-label-team-assignments.ts';
import type { OctokitClient, IssuesEvent, TeamAssignment } from '../../types.ts';

interface FieldOption {
	id: string;
	name: string;
}

interface ProjectField {
	id: string;
	name: string;
	options?: FieldOption[];
}

interface ProjectInfo {
	ownerType?: string;
	ownerName?: string;
	projectNumber?: number;
	projectNodeId?: string;
	priority?: ProjectField;
	status?: ProjectField;
	team?: ProjectField;
	type?: ProjectField;
}

/**
 * Get Information about a project board.
 *
 * @param octokit          - Initialized Octokit REST client.
 * @param projectBoardLink - The link to the project board.
 * @return Project board information.
 */
async function getProjectDetails(
	octokit: OctokitClient,
	projectBoardLink: string
): Promise< ProjectInfo > {
	const projectRegex =
		/^(?:https:\/\/)?github\.com\/(?<ownerType>orgs|users)\/(?<ownerName>[^/]+)\/projects\/(?<projectNumber>\d+)/;
	const matches = projectBoardLink.match( projectRegex );
	if ( ! matches ) {
		debug(
			`triage-issues > update-board: Invalid project board link provided. Cannot triage to a board`
		);
		return {};
	}

	const {
		groups: { ownerType, ownerName, projectNumber },
	} = matches as RegExpMatchArray & {
		groups: { ownerType: string; ownerName: string; projectNumber: string };
	};

	const projectInfo: ProjectInfo = {
		ownerType: ownerType === 'orgs' ? 'organization' : 'user', // GitHub API requests require 'organization' or 'user'.
		ownerName,
		projectNumber: parseInt( projectNumber, 10 ),
	};

	debug( `triage-issues > update-board: Fetching info about project board.` );

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

	const details = projectDetails as Record<
		string,
		{ projectV2: { id: string; fields: { nodes: ProjectField[] } } }
	>;

	// Extract the project node ID.
	const projectNodeId = details[ projectInfo.ownerType as string ]?.projectV2.id;
	if ( projectNodeId ) {
		projectInfo.projectNodeId = projectNodeId; // Project board node ID. String.
	}

	// Extract the ID of the Priority field.
	const priorityField = details[ projectInfo.ownerType as string ]?.projectV2.fields.nodes.find(
		field => field.name === 'Priority'
	);
	if ( priorityField ) {
		projectInfo.priority = priorityField; // Info about our Priority column (id as well as possible values).
	}

	// Extract the ID of the Status field.
	const statusField = details[ projectInfo.ownerType as string ]?.projectV2.fields.nodes.find(
		field => field.name === 'Status'
	);
	if ( statusField ) {
		projectInfo.status = statusField; // Info about our Status column (id as well as possible values).
	}

	// Extract the ID of the Team field.
	const teamField = details[ projectInfo.ownerType as string ]?.projectV2.fields.nodes.find(
		field => field.name === 'Team'
	);
	if ( teamField ) {
		projectInfo.team = teamField; // Info about our Team column (id as well as possible values).
	}

	// Extract the ID of the Type field.
	const typeField = details[ projectInfo.ownerType as string ]?.projectV2.fields.nodes.find(
		field => field.name === 'Type'
	);
	if ( typeField ) {
		projectInfo.type = typeField; // Info about our Type column (id as well as possible values).
	}

	return projectInfo;
}

/**
 * Check if an issue is on our project board.
 * If it is, return the ID of the project item.
 *
 * @param octokit     - Initialized Octokit REST client.
 * @param projectInfo - Info about our project board.
 * @param repoName    - The name of the repository.
 * @param issueId     - The ID of the issue.
 * @return The ID of the project item, or an empty string if not found.
 */
async function getIssueProjectItemId(
	octokit: OctokitClient,
	projectInfo: ProjectInfo,
	repoName: string,
	issueId: number
): Promise< string > {
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

	const details = projectItemDetails as {
		repository: {
			issue: {
				projectItems: {
					nodes: Array< { id: string; project: { number: number } } >;
				};
			};
		};
	};

	// Only keep the project item ID for the project board we're interested in.
	const projectItemId = details.repository.issue.projectItems.nodes.find(
		item => item.project.number === projectNumber
	)?.id;

	return projectItemId || '';
}

/**
 * Add Issue to our project board.
 *
 * @param payload     - Issue event payload.
 * @param octokit     - Initialized Octokit REST client.
 * @param projectInfo - Info about our project board.
 * @return Info about the project item id that was created.
 */
async function addIssueToBoard(
	payload: IssuesEvent,
	octokit: OctokitClient,
	projectInfo: ProjectInfo
): Promise< string > {
	const {
		issue: { number, node_id },
		repository: {
			owner: { login: ownerLogin },
			name,
		},
	} = payload;
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

	const details = projectItemDetails as {
		addProjectV2ItemById: { item: { id: string } };
	};

	const projectItemId = details.addProjectV2ItemById.item.id;
	if ( ! projectItemId ) {
		debug( `triage-issues > update-board: Failed to add issue to project board.` );
		return '';
	}

	debug( `triage-issues > update-board: Added issue to project board.` );

	// Add label to indicate that the issue was automatically triaged.
	await octokit.rest.issues.addLabels( {
		owner: ownerLogin,
		repo: name,
		issue_number: number,
		labels: [ '[Status] Auto-allocated' ],
	} );

	return projectItemId;
}

/**
 * Set custom priority field for a project item.
 *
 * @param octokit       - Initialized Octokit REST client.
 * @param projectInfo   - Info about our project board.
 * @param projectItemId - The ID of the project item.
 * @param priorityText  - Priority of our issue (must match an existing column in the project board).
 * @return The new project item id.
 */
async function setPriorityField(
	octokit: OctokitClient,
	projectInfo: ProjectInfo,
	projectItemId: string,
	priorityText: string
): Promise< string > {
	const {
		projectNodeId, // Project board node ID.
		priority: {
			id: priorityFieldId, // ID of the priority field.
			options,
		},
	} = projectInfo as ProjectInfo & { priority: ProjectField & { options: FieldOption[] } };

	// Find the ID of the priority option that matches our PR priority.
	const priorityOptionId = options.find( option => option.name === priorityText )?.id;
	if ( ! priorityOptionId ) {
		debug(
			`triage-issues > update-board: Priority ${ priorityText } does not exist as a column option in the project board.`
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

	const details = projectNewItemDetails as {
		set_priority: { projectV2Item: { id: string } };
	};

	const newProjectItemId = details.set_priority.projectV2Item.id;
	if ( ! newProjectItemId ) {
		debug(
			`triage-issues > update-board: Failed to set the "${ priorityText }" priority for this project item.`
		);
		return '';
	}

	debug(
		`triage-issues > update-board: Project item ${ newProjectItemId } was moved to "${ priorityText }" priority.`
	);

	return newProjectItemId; // New Project item ID (what we just edited). String.
}

/**
 * Set the Type field for a project item, to match the Type label if it exists.
 *
 * @param octokit       - Initialized Octokit REST client.
 * @param projectInfo   - Info about our project board.
 * @param projectItemId - The ID of the project item.
 * @param typeText      - Type of our issue (must match an existing column in the project board).
 * @return The new project item id.
 */
async function setTypeField(
	octokit: OctokitClient,
	projectInfo: ProjectInfo,
	projectItemId: string,
	typeText: string
): Promise< string > {
	const {
		projectNodeId, // Project board node ID.
		type: {
			id: typeFieldId, // ID of the type field.
			options,
		},
	} = projectInfo as ProjectInfo & { type: ProjectField & { options: FieldOption[] } };

	// Find the ID of the Type option that matches our issue type label.
	const typeOptionId = options.find( option => option.name === typeText )?.id;
	if ( ! typeOptionId ) {
		debug(
			`triage-issues > update-board: Type ${ typeText } does not exist as a column option in the project board.`
		);
		return '';
	}

	const projectNewItemDetails = await octokit.graphql(
		`mutation ( $input: UpdateProjectV2ItemFieldValueInput! ) {
			set_type: updateProjectV2ItemFieldValue( input: $input ) {
				projectV2Item {
					id
				}
			}
		}`,
		{
			input: {
				projectId: projectNodeId,
				itemId: projectItemId,
				fieldId: typeFieldId,
				value: {
					singleSelectOptionId: typeOptionId,
				},
			},
		}
	);

	const details = projectNewItemDetails as {
		set_type: { projectV2Item: { id: string } };
	};

	const newProjectItemId = details.set_type.projectV2Item.id;
	if ( ! newProjectItemId ) {
		debug(
			`triage-issues > update-board: Failed to set the "${ typeText }" type for this project item.`
		);
		return '';
	}

	debug(
		`triage-issues > update-board: Project item ${ newProjectItemId } was moved to "${ typeText }" type.`
	);

	return newProjectItemId; // New Project item ID (what we just edited). String.
}

/**
 * Update the "Status" field in our project board.
 *
 * @param octokit       - Initialized Octokit REST client.
 * @param projectInfo   - Info about our project board.
 * @param projectItemId - The ID of the project item.
 * @param statusText    - Status of our issue (must match an existing column in the project board).
 * @return The new project item id.
 */
async function setStatusField(
	octokit: OctokitClient,
	projectInfo: ProjectInfo,
	projectItemId: string,
	statusText: string
): Promise< string > {
	const {
		projectNodeId, // Project board node ID.
		status: {
			id: statusFieldId, // ID of the status field.
			options,
		},
	} = projectInfo as ProjectInfo & { status: ProjectField & { options: FieldOption[] } };

	// Find the ID of the status option that matches our issue status.
	const statusOptionId = options.find( option => option.name === statusText )?.id;
	if ( ! statusOptionId ) {
		debug(
			`triage-issues > update-board: Status ${ statusText } does not exist as a column option in the project board.`
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

	const details = projectNewItemDetails as {
		set_status: { projectV2Item: { id: string } };
	};

	const newProjectItemId = details.set_status.projectV2Item.id;
	if ( ! newProjectItemId ) {
		debug(
			`triage-issues > update-board: Failed to set the "${ statusText }" status for this project item.`
		);
		return '';
	}

	debug(
		`triage-issues > update-board: Project item ${ newProjectItemId } was moved to "${ statusText }" status.`
	);

	return newProjectItemId; // New Project item ID (what we just edited). String.
}

/**
 * Update the "Team" field in our project board.
 *
 * @param octokit       - Initialized Octokit REST client.
 * @param projectInfo   - Info about our project board.
 * @param projectItemId - The ID of the project item.
 * @param team          - Team that should be assigned to our issue (must match an existing column in the project board).
 * @return The new project item id.
 */
async function setTeamField(
	octokit: OctokitClient,
	projectInfo: ProjectInfo,
	projectItemId: string,
	team: string
): Promise< string > {
	const {
		projectNodeId, // Project board node ID.
		team: {
			id: teamFieldID, // ID of the status field.
			options,
		},
	} = projectInfo as ProjectInfo & { team: ProjectField & { options: FieldOption[] } };

	// Find the ID of the team option that matches our issue team.
	const teamOptionId = options.find( option => option.name === team )?.id;
	if ( ! teamOptionId ) {
		debug(
			`triage-issues > update-board: Team "${ team }" does not exist as a column option in the project board.`
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

	const details = projectNewItemDetails as {
		set_team: { projectV2Item: { id: string } };
	};

	const newProjectItemId = details.set_team.projectV2Item.id;
	if ( ! newProjectItemId ) {
		debug(
			`triage-issues > update-board: Failed to set the "${ team }" team for this project item.`
		);
		return '';
	}

	debug(
		`triage-issues > update-board: Project item ${ newProjectItemId } was assigned to the "${ team }" team.`
	);

	return newProjectItemId; // New Project item ID (what we just edited). String.
}

/**
 * Load a mapping of teams <> labels from a file.
 *
 * @param ownerLogin - Repository owner login.
 *
 * @return Mapping of teams <> labels.
 */
async function loadTeamAssignments(
	ownerLogin: string
): Promise< Record< string, TeamAssignment > > {
	// If we're in an Automattic repo, we can use the team assignments file that ships with this action.
	if ( 'automattic' === ownerLogin.toLowerCase() ) {
		return automatticAssignments;
	}

	const teamAssignmentsString = getInput( 'labels_team_assignments' );
	if ( ! teamAssignmentsString ) {
		debug(
			`triage-issues > update-board: No mapping of teams <> labels provided. Cannot automatically assign an issue to a specific team on the board. Aborting.`
		);
		return {};
	}

	const teamAssignments: Record< string, TeamAssignment > = JSON.parse( teamAssignmentsString );
	// Check if it is a valid object and includes information about teams and labels.
	if (
		! teamAssignments ||
		! Object.keys( teamAssignments ).length ||
		! Object.values( teamAssignments ).some( assignment => assignment.team ) ||
		! Object.values( teamAssignments ).some( assignment => assignment.labels )
	) {
		debug(
			`triage-issues > update-board: Invalid mapping of teams <> labels provided. Cannot automatically assign an issue to a specific team on the board. Aborting.`
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
 * @param octokit        - Initialized Octokit REST client.
 * @param payload        - Issue event payload.
 * @param projectInfo    - Info about our project board.
 * @param projectItemId  - The ID of the project item.
 * @param isBug          - Is the issue a bug?
 * @param priorityLabels - Array of priority labels.
 * @return The new project item id.
 */
async function assignTeam(
	octokit: OctokitClient,
	payload: IssuesEvent,
	projectInfo: ProjectInfo,
	projectItemId: string,
	isBug: boolean,
	priorityLabels: string[]
): Promise< string > {
	const {
		action,
		issue: { number },
		repository: { owner, name },
	} = payload;
	const label = 'label' in payload ? payload.label : undefined;
	const ownerLogin = owner.login;

	const teamAssignments = await loadTeamAssignments( ownerLogin );
	if ( ! teamAssignments ) {
		debug(
			`triage-issues > update-board: No mapping of teams <> labels provided. Cannot automatically assign an issue to a specific team on the board. Aborting.`
		);
		return projectItemId;
	}

	// Get the list of labels associated with this issue.
	const labels = await getLabels( octokit, ownerLogin, name, number );
	if ( 'labeled' === action && label?.name ) {
		labels.push( label.name );
	}

	// Check if any of the labels on this issue match a team.
	// Loop through all the mappings in team assignments,
	// and find the first one that includes a label that matches one present in the issue.
	const [ featureName, { team, slack_id, board_id } = {} as TeamAssignment ] =
		Object.entries( teamAssignments ).find( ( [ , assignment ] ) =>
			labels.some( mappedLabel => assignment.labels.includes( mappedLabel ) )
		) || [];

	if ( ! team ) {
		debug(
			`triage-issues > update-board: Issue #${ number } does not have a label that matches a team. Aborting.`
		);
		return projectItemId;
	}

	// Set the status field for this project item.
	debug(
		`triage-issues > update-board: Assigning the "${ team }" team for this project item, issue #${ number }.`
	);
	projectItemId = await setTeamField( octokit, projectInfo, projectItemId, team );

	// Does the team want to be notified in Slack about high/blocker priority issues?
	if (
		slack_id &&
		priorityLabels.length > 0 &&
		( priorityLabels.includes( '[Pri] BLOCKER' ) || priorityLabels.includes( '[Pri] High' ) ) &&
		isBug
	) {
		debug(
			`triage-issues > update-board: Issue #${ number } has the following priority labels: ${ priorityLabels.join(
				', '
			) }. The ${ team } team is interested in getting Slack updates for important issues. Let's notify them.`
		);
		await notifyImportantIssues( octokit, payload, slack_id, 'devs' );
	}

	// Does the team have a Project board where they track work for this feature? We can add the issue to that board.
	if ( board_id ) {
		debug(
			`triage-issues > update-board: Issue #${ number } is associated with the "${ featureName }" feature, and the ${ team } team has a dedicated project board for this feature. Let's add the issue to that board.`
		);

		// Get details about our project board, to use in our requests.
		const featureProjectInfo = await getProjectDetails( octokit, board_id );
		if ( Object.keys( featureProjectInfo ).length === 0 || ! featureProjectInfo.projectNodeId ) {
			setFailed(
				`triage-issues > update-board: we cannot fetch info about the project board associated to the "${ featureName }" feature. Aborting task.`
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
			debug(
				`triage-issues > update-board: Issue #${ number } is not on our project board. Let's add it.`
			);

			featureIssueItemId = await addIssueToBoard( payload, octokit, featureProjectInfo );
			if ( ! featureIssueItemId ) {
				debug( `triage-issues > update-board: Failed to add issue to project board. Aborting.` );
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
 * @param payload        - Issue event payload.
 * @param octokit        - Initialized Octokit REST client.
 * @param issueType      - Type of the issue, defined by a "[Type]" label on the issue.
 * @param priorityLabels - Array of Priority Labels matching this issue.
 */
async function updateBoard(
	payload: IssuesEvent,
	octokit: OctokitClient,
	issueType: string,
	priorityLabels: string[]
): Promise< void > {
	const {
		issue: { number },
		repository: { owner, name },
	} = payload;
	const ownerLogin = owner.login;

	const isBug = issueType === 'Bug';

	const projectToken = getInput( 'triage_projects_token' );
	if ( ! projectToken ) {
		debug(
			`triage-issues > update-board: Input triage_projects_token is required but missing. Aborting.`
		);
		return;
	}

	const projectBoardLink = getInput( 'project_board_url' );
	if ( ! projectBoardLink ) {
		debug(
			`triage-issues > update-board: No project board link provided. Cannot triage to a board. Aborting.`
		);
		return;
	}

	// For this task, we need octokit to have extra permissions not provided by the default GitHub token.
	// Let's create a new octokit instance using our own custom token.

	const projectOctokit = getOctokit( projectToken );

	// Get details about our project board, to use in our requests.
	const projectInfo = await getProjectDetails( projectOctokit, projectBoardLink );
	if ( Object.keys( projectInfo ).length === 0 || ! projectInfo.projectNodeId ) {
		debug(
			`triage-issues > update-board: we cannot fetch info about our project board. Aborting task.`
		);
		return;
	}

	// Check if the issue is already on the project board. If so, return its ID.
	let projectItemId = await getIssueProjectItemId( projectOctokit, projectInfo, name, number );

	// If we have no ID, that means the issue isn't on the board yet.
	// If it is a bug, add it to the board.
	if ( ! projectItemId && isBug ) {
		debug(
			`triage-issues > update-board: Issue #${ number } is not on our project board. Let's add it.`
		);
		projectItemId = await addIssueToBoard( payload, projectOctokit, projectInfo );

		if ( projectItemId ) {
			// Set the "Needs Triage" status for our issue on the board.
			debug(
				`triage-issues > update-board: Setting the "Needs Triage" status for this project item, issue #${ number }.`
			);
			projectItemId = await setStatusField(
				projectOctokit,
				projectInfo,
				projectItemId,
				'Needs Triage'
			);
		} else {
			debug( `triage-issues > update-board: Failed to add issue to project board.` );
		}
	}

	// Check if the type needs to be updated for that issue.
	// We do need info about the type column in the board to be able to do that.
	if ( issueType && projectInfo.type && projectItemId ) {
		debug(
			`triage-issues > update-board: Issue #${ number } has a type label set, ${ issueType }. Let's ensure the Type field of the project board matches that.`
		);

		// So far, our project board only supports the following types: 'Bug', 'Enhancement', and 'Task'
		if ( [ 'Bug', 'Enhancement', 'Task' ].includes( issueType ) ) {
			projectItemId = await setTypeField( projectOctokit, projectInfo, projectItemId, issueType );
		}
	}

	// Check if priority needs to be updated for that issue.
	// We do need info about the priority column in the board to be able to do that.
	if ( priorityLabels.length > 0 && projectInfo.priority && projectItemId ) {
		debug(
			`triage-issues > update-board: Issue #${ number } has the following priority labels: ${ priorityLabels.join(
				', '
			) }`
		);

		// Remove the "[Pri]" prefix from our priority labels. We also only need one label.
		const priorityText = priorityLabels[ 0 ].replace( /^\[Pri\]\s*/, '' );

		// Set the priority field for this project item.
		debug(
			`triage-issues > update-board: Setting the "${ priorityText }" priority for this project item, issue #${ number }.`
		);
		projectItemId = await setPriorityField(
			projectOctokit,
			projectInfo,
			projectItemId,
			priorityText
		);
	}

	const labels = await getLabels( octokit, ownerLogin, name, number );
	// Check if the issue has a "Triaged" label.
	if ( labels.includes( 'Triaged' ) && projectItemId ) {
		// Check if the issue depends on a third-party,
		// and thus cannot be fully triaged by us.
		// In practice, we look for 2 different labels:
		// "[Status] Needs 3rd Party Fix" and "[Status] Needs Core Fix"
		if ( labels.some( label => label.match( /^\[Status\] Needs (3rd Party|Core) Fix$/ ) ) ) {
			// Let's update the status field to "Needs Core/3rd Party Fix" instead of "Triaged".
			debug(
				`triage-issues > update-board: Issue #${ number } needs a third-party fix. Setting the "Needs Core/3rd Party Fix" status for this project item.`
			);
			await setStatusField(
				projectOctokit,
				projectInfo,
				projectItemId,
				'Needs Core/3rd Party Fix'
			);
		} else {
			debug(
				`triage-issues > update-board: Setting the "Triaged" status for this project item, issue #${ number }.`
			);
			await setStatusField( projectOctokit, projectInfo, projectItemId, 'Triaged' );
		}
	}

	// Try to assign the issue to a specific team, if we have a mapping of teams <> labels and a matching label on the issue.
	// When assigning, we can also do more to warn the team about the issue, if we have additional info (Slack, project board).
	if ( projectItemId ) {
		// eslint-disable-next-line no-useless-assignment -- Parallelism, in case more clauses are added in the future, is more important than skipping the useless assignment here.
		projectItemId = await assignTeam(
			projectOctokit,
			payload,
			projectInfo,
			projectItemId,
			isBug,
			priorityLabels
		);
	}
}

export default updateBoard;
