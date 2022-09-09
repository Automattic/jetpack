const fs = require( 'fs' );
const path = require( 'path' );
const moment = require( 'moment' );
const debug = require( '../../utils/debug' );
const getAffectedChangeloggerProjects = require( '../../utils/get-affected-changelogger-projects' );
const getComments = require( '../../utils/get-comments' );
const getFiles = require( '../../utils/get-files' );
const getLabels = require( '../../utils/get-labels' );
const getNextValidMilestone = require( '../../utils/get-next-valid-milestone' );
const getPluginNames = require( '../../utils/get-plugin-names' );
const getPrWorkspace = require( '../../utils/get-pr-workspace' );

/* global GitHub, WebhookPayloadPullRequest */

/**
 * Check if a PR has unverified commits.
 *
 * @param {GitHub} octokit - Initialized Octokit REST client.
 * @param {string} owner   - Repository owner.
 * @param {string} repo    - Repository name.
 * @param {string} number  - PR number.
 * @returns {Promise<boolean>} Promise resolving to boolean.
 */
async function hasUnverifiedCommit( octokit, owner, repo, number ) {
	for await ( const response of octokit.paginate.iterator( octokit.rest.pulls.listCommits, {
		owner,
		repo,
		pull_number: +number,
	} ) ) {
		if ( response.data.find( commit => commit.commit.message.includes( '[not verified]' ) ) ) {
			return true;
		}
	}

	return false;
}

/**
 * Check for status labels on a PR.
 *
 * @param {GitHub} octokit - Initialized Octokit REST client.
 * @param {string} owner   - Repository owner.
 * @param {string} repo    - Repository name.
 * @param {string} number  - PR number.
 * @returns {Promise<boolean>} Promise resolving to boolean.
 */
async function hasStatusLabels( octokit, owner, repo, number ) {
	const labels = await getLabels( octokit, owner, repo, number );
	// We're only interested in status labels, but not the "Needs Reply" label since it can be added by the action.
	return !! labels.find( label => label.match( /^\[Status\].*(?<!Author Reply)$/ ) );
}

/**
 * Check for a "Need Review" label on a PR.
 *
 * @param {GitHub} octokit - Initialized Octokit REST client.
 * @param {string} owner   - Repository owner.
 * @param {string} repo    - Repository name.
 * @param {string} number  - PR number.
 * @returns {Promise<boolean>} Promise resolving to boolean.
 */
async function hasNeedsReviewLabel( octokit, owner, repo, number ) {
	const labels = await getLabels( octokit, owner, repo, number );
	// We're really only interested in the Needs review label.
	return !! labels.find( label => label.includes( '[Status] Needs Review' ) );
}

/**
 * Check for a "In Progress" status label on a PR.
 *
 * @param {GitHub} octokit - Initialized Octokit REST client.
 * @param {string} owner   - Repository owner.
 * @param {string} repo    - Repository name.
 * @param {string} number  - PR number.
 * @returns {Promise<boolean>} Promise resolving to boolean.
 */
async function hasProgressLabel( octokit, owner, repo, number ) {
	const labels = await getLabels( octokit, owner, repo, number );
	// We're really only interested in the In Progress label.
	return labels.includes( '[Status] In Progress' );
}

/**
 * Build some info about a specific plugin's release dates.
 *
 * @param {string} plugin        - Plugin name.
 * @param {object} nextMilestone - Information about next milestone as returnde by GitHub.
 * @returns {Promise<string>} Promise resolving to info about the release (code freeze, release date).
 */
async function getMilestoneDates( plugin, nextMilestone ) {
	let releaseDate;
	let codeFreezeDate;
	if ( nextMilestone && nextMilestone.hasOwnProperty( 'due_on' ) && nextMilestone.due_on ) {
		releaseDate = moment( nextMilestone.due_on ).format( 'LL' );

		// Look for a code freeze date in the milestone description.
		const dateRegex = /^Code Freeze: (\d{4}-\d{2}-\d{2})\s*$/m;
		const freezeDateDescription = nextMilestone.description.match( dateRegex );

		// If we have a date and it is valid, use it, otherwise set code freeze to a week before the release.
		if ( freezeDateDescription && moment( freezeDateDescription[ 1 ] ).isValid() ) {
			codeFreezeDate = moment( freezeDateDescription[ 1 ] ).format( 'LL' );
		} else {
			codeFreezeDate = moment( nextMilestone.due_on ).subtract( 7, 'd' ).format( 'LL' );
		}
	} else {
		// Fallback to raw math calculation
		// Calculate next release date
		const firstTuesdayOfMonth = moment().add( 1, 'months' ).startOf( 'month' );
		while ( firstTuesdayOfMonth.day() !== 2 ) {
			firstTuesdayOfMonth.add( 1, 'day' );
		}
		releaseDate = firstTuesdayOfMonth.format( 'LL' );
		// Calculate next code freeze date
		codeFreezeDate = firstTuesdayOfMonth.subtract( 8, 'd' ).format( 'LL' );
	}

	const capitalizedName = plugin
		.split( '-' )
		// Capitalize first letter of each word.
		.map( word => `${ word[ 0 ].toUpperCase() }${ word.slice( 1 ) }` )
		// Spaces between words.
		.join( ' ' );

	return `
******

**${ capitalizedName } plugin:**
- Next scheduled release: _${ releaseDate }_.
- Scheduled code freeze: _${ codeFreezeDate }_.
`;
}

/**
 * Build a string with info about the next milestone.
 *
 * @param {GitHub} octokit - Initialized Octokit REST client.
 * @param {string} owner   - Repository owner.
 * @param {string} repo    - Repository name.
 * @param {string} number  - PR number.
 * @returns {Promise<string>} Promise resolving to info about the next release for that plugin.
 */
async function buildMilestoneInfo( octokit, owner, repo, number ) {
	const plugins = await getPluginNames( octokit, owner, repo, number );
	let pluginInfo = '';

	debug( `check-description: This PR impacts the following plugins: ${ plugins.join( ', ' ) }` );

	// Get next valid milestone for each plugin.
	for await ( const plugin of plugins ) {
		const nextMilestone = await getNextValidMilestone( octokit, owner, repo, plugin );
		debug( `check-description: Milestone found: ${ JSON.stringify( nextMilestone ) }` );

		debug( `check-description: getting milestone info for ${ plugin }` );
		const info = await getMilestoneDates( plugin, nextMilestone );

		pluginInfo += info;
	}

	return pluginInfo;
}

/**
 * Search for a previous comment from this task in our PR.
 *
 * @param {GitHub} octokit - Initialized Octokit REST client.
 * @param {string} owner   - Repository owner.
 * @param {string} repo    - Repository name.
 * @param {string} number  - PR number.
 * @returns {Promise<number>} Promise resolving to boolean.
 */
async function getCheckComment( octokit, owner, repo, number ) {
	let commentID = 0;

	debug( `check-description: Looking for a previous comment from this task in our PR.` );

	const comments = await getComments( octokit, owner, repo, number );
	comments.map( comment => {
		if (
			comment.user.login === 'github-actions[bot]' &&
			comment.body.includes( '**Thank you for your PR!**' )
		) {
			commentID = comment.id;
		}
	} );

	return commentID;
}

/**
 * Compose a list item with appropriate status check and passed message
 *
 * @param {boolean} isFailure - Boolean condition to determine if check failed.
 * @param {string} checkMessage - Sentence describing successful check.
 * @param {string} severity - Optional. Check severity. Could be one of `error`, `warning`, `notice`
 * @returns {string} - List item with status emoji and a sentence describing check.
 */
function statusEntry( isFailure, checkMessage, severity = 'error' ) {
	const severityMap = {
		error: ':red_circle:',
		warning: ':warning:',
		notice: ':spiral_notepad:',
		ok: ':white_check_mark:',
	};
	const status = isFailure ? severityMap[ severity ] : severityMap.ok;
	return `
- ${ status } ${ checkMessage }<br>`;
}

/**
 * Returns list of projects with missing changelog entries
 *
 * @param {GitHub} octokit - Initialized Octokit REST client.
 * @param {string} owner   - Repository owner.
 * @param {string} repo    - Repository name.
 * @param {string} number  - PR number.
 * @returns {Array} - list of affected projects without changelog entry
 */
async function getChangelogEntries( octokit, owner, repo, number ) {
	const baseDir = getPrWorkspace();
	const files = await getFiles( octokit, owner, repo, number );
	const affectedProjects = getAffectedChangeloggerProjects( files );
	debug( `check-description: affected changelogger projects: ${ affectedProjects }` );

	return affectedProjects.reduce( ( acc, project ) => {
		const composerFile = `${ baseDir }/projects/${ project }/composer.json`;
		const json = JSON.parse( fs.readFileSync( composerFile ) );
		// Changelog directory could customized via .extra.changelogger.changes-dir in composer.json. Lets check for it.
		const changelogDir =
			path.relative(
				baseDir,
				path.resolve(
					`${ baseDir }/projects/${ project }`,
					( json.extra && json.extra.changelogger && json.extra.changelogger[ 'changes-dir' ] ) ||
						'changelog'
				)
			) + '/';
		const found = files.find( file => file.startsWith( changelogDir ) );
		if ( ! found ) {
			acc.push( `projects/${ project }` );
		}
		return acc;
	}, [] );
}

/**
 * Compose a list of checks for the PR
 * Covers:
 * - Short PR description
 * - Unverified commits
 * - Missing `[Status]` label
 * - Missing "Testing instructions"
 * - Missing Changelog entry
 * - Privacy section
 *
 * Note: All the checks should be truthy to resolve as success check.
 *
 * @param {WebhookPayloadPullRequest} payload - Pull request event payload.
 * @param {GitHub}                    octokit - Initialized Octokit REST client.
 * @returns {string} List of checks with appropriate status emojis.
 */
async function getStatusChecks( payload, octokit ) {
	const { body, number, head, base } = payload.pull_request;
	const { name: repo, owner } = payload.repository;
	const ownerLogin = owner.login;

	const hasLongDescription = body.length > 200;
	const isClean = ! ( await hasUnverifiedCommit( octokit, ownerLogin, repo, number ) );
	const isLabeled = await hasStatusLabels( octokit, ownerLogin, repo, number );
	const hasTesting = body.includes( 'Testing instructions' );
	const hasPrivacy = body.includes( 'data or activity we track or use' );
	const projectsWithoutChangelog = await getChangelogEntries( octokit, ownerLogin, repo, number );
	const isFromContributor = head.repo.full_name === base.repo.full_name;

	return {
		hasLongDescription,
		isClean,
		isLabeled,
		hasTesting,
		hasPrivacy,
		projectsWithoutChangelog,
		hasChangelogEntries: projectsWithoutChangelog.length === 0,
		isFromContributor,
	};
}

/**
 * Compose a list of checks for the PR
 *
 * @param {object} statusChecks - Map of all checks with boolean as a value
 * @returns {string} part of the comment with list of checks
 */
function renderStatusChecks( statusChecks ) {
	// No PR is too small to include a description of why you made a change
	let checks = statusEntry(
		! statusChecks.hasLongDescription,
		'Include a description of your PR changes.'
	);

	// Check all commits in PR.
	// In this case, we use a different failure icon, as we do not consider this a blocker, it should not trigger label changes.
	checks += statusEntry(
		! statusChecks.isClean,
		'All commits were linted before commit.',
		'warning'
	);

	// Use labels please!
	// Only check this for PRs created by a12s. External contributors cannot add labels.
	if ( statusChecks.isFromContributor ) {
		debug( `check-description: this PR is correctly labeled: ${ statusChecks.isLabeled }` );
		checks += statusEntry(
			! statusChecks.isLabeled,
			'Add a "[Status]" label (In Progress, Needs Team Review, ...).'
		);
	}

	// Check for testing instructions.
	checks += statusEntry( ! statusChecks.hasTesting, 'Add testing instructions.' );

	// Check if the Privacy section is filled in.
	checks += statusEntry(
		! statusChecks.hasPrivacy,
		'Specify whether this PR includes any changes to data or privacy.'
	);

	debug(
		`check-description: Changelog entries missing for ${ statusChecks.projectsWithoutChangelog }`
	);
	checks += statusEntry(
		! statusChecks.hasChangelogEntries,
		'Add changelog entries to affected projects'
	);

	debug( `check-description: privacy checked. Status checks so far is ${ checks }` );

	return checks;
}

/**
 * Compose a list of recommendations based on failed checks
 *
 * @param {object} statusChecks - Map of all checks with boolean as a value
 * @returns {string} part of the comment with recommendations
 */
function renderRecommendations( statusChecks ) {
	const recommendations = {
		hasLongDescription:
			'Please edit your PR description and explain what functional changes your PR includes, and why those changes are needed.',
		hasPrivacy: `We would recommend that you add a section to the PR description to specify whether this PR includes any changes to data or privacy, like so:
~~~
#### Does this pull request change what data or activity we track or use?

My PR adds *x* and *y*.
~~~`,
		hasTesting: `Please include detailed testing steps, explaining how to test your change, like so:
~~~
#### Testing instructions:

* Go to '..'
*
~~~`,
		hasChangelogEntries: `Please add missing changelog entries for the following projects: \`${ statusChecks.projectsWithoutChangelog.join(
			'`, `'
		) }\`

Use [the Jetpack CLI tool](https://github.com/Automattic/jetpack/blob/trunk/docs/monorepo.md#first-time) to generate changelog entries by running the following command: \`jetpack changelog add\`.
Guidelines: [/docs/writing-a-good-changelog-entry.md](https://github.com/Automattic/jetpack/blob/trunk/docs/writing-a-good-changelog-entry.md)
`,
	};

	// If some of the tests are failing, display list of things that could be updated in the PR description to fix things.
	return Object.keys( statusChecks ).reduce( ( output, check ) => {
		// If some of the checks have failed, lets recommend some next steps.
		if ( ! statusChecks[ check ] && recommendations[ check ] ) {
			output += `
:red_circle: **Action required:** ${ recommendations[ check ] }

******`;
		}
		return output;
	}, '' );
}

/**
 * Creates or updates a comment on PR.
 *
 * @param {WebhookPayloadPullRequest} payload - Pull request event payload.
 * @param {GitHub} octokit - Initialized Octokit REST client.
 * @param {string} comment - Comment string
 */
async function postComment( payload, octokit, comment ) {
	const { number } = payload.pull_request;
	const { name: repo, owner } = payload.repository;
	const ownerLogin = owner.login;
	const commentOpts = {
		owner: ownerLogin,
		repo,
		body: comment,
	};

	const existingComment = await getCheckComment( octokit, ownerLogin, repo, number );

	// If there is a comment already, update it.
	if ( existingComment !== 0 ) {
		debug( `check-description: update comment ID ${ existingComment } with our new remarks` );
		await octokit.rest.issues.updateComment( {
			...commentOpts,
			comment_id: +existingComment,
		} );
	} else {
		// If no comment was published before, publish one now.
		debug( `check-description: Posting comment to PR #${ number }` );
		await octokit.rest.issues.createComment( {
			...commentOpts,
			issue_number: +number,
		} );
	}
}

/**
 * Update labels for PRs with failing checks
 *
 * @param {WebhookPayloadPullRequest} payload - Pull request event payload.
 * @param {GitHub}                    octokit - Initialized Octokit REST client.
 */
async function updateLabels( payload, octokit ) {
	const { number } = payload.pull_request;
	const { name: repo, owner } = payload.repository;
	const ownerLogin = owner.login;
	const labelOpts = {
		owner: ownerLogin,
		repo,
		issue_number: +number,
	};

	debug( `check-description: some of the checks are failing. Update labels accordingly.` );

	const hasNeedsReview = await hasNeedsReviewLabel( octokit, ownerLogin, repo, number );
	if ( hasNeedsReview ) {
		debug( `check-description: remove existing Needs review label.` );
		await octokit.rest.issues.removeLabel( {
			...labelOpts,
			name: '[Status] Needs Review',
		} );
	}

	// Add the "Needs Author Reply" label, unless the author marked their PR as in progress.
	const isInProgress = await hasProgressLabel( octokit, ownerLogin, repo, number );
	if ( ! isInProgress ) {
		debug( `check-description: add Needs Author Reply label.` );
		await octokit.rest.issues.addLabels( {
			...labelOpts,
			labels: [ '[Status] Needs Author Reply' ],
		} );
	}
}

/**
 * Checks the contents of a PR description.
 *
 * @param {WebhookPayloadPullRequest} payload - Pull request event payload.
 * @param {GitHub}                    octokit - Initialized Octokit REST client.
 */
async function checkDescription( payload, octokit ) {
	const {
		number,
		user: { login: author },
		head: { ref: ref },
	} = payload.pull_request;
	const { name: repo, owner } = payload.repository;
	const ownerLogin = owner.login;
	const statusChecks = await getStatusChecks( payload, octokit );

	debug( `check-description: Status checks: ${ JSON.stringify( statusChecks ) }` );

	if ( ref.startsWith( 'renovate/' ) && ( author === 'renovate[bot]' || author === 'matticbot' ) ) {
		debug( `check-description: Renovate PR, skipping` );
		return;
	}

	debug( `check-description: start building our comment` );

	// We'll add any remarks we may have about the PR to that comment body.
	let comment = `**Thank you for your PR!**

When contributing to Jetpack, we have [a few suggestions](https://github.com/Automattic/jetpack/blob/trunk/.github/PULL_REQUEST_TEMPLATE.md) that can help us test and review your patch:<br>`;

	comment += renderStatusChecks( statusChecks );
	comment += `


This comment will be updated as you work on your PR and make changes. If you think that some of those checks are not needed for your PR, please explain why you think so. Thanks for cooperation :robot:

******`;

	comment += `

The e2e test report can be found [here](https://automattic.github.io/jetpack-e2e-reports/${ number }/report/). Please note that it can take a few minutes after the e2e tests checks are complete for the report to be available.

******`;

	comment += renderRecommendations( statusChecks );

	// Display extra info for Automatticians (who can handle labels and who created the PR without a fork).
	if ( statusChecks.isFromContributor ) {
		comment += `

Once your PR is ready for review, check one last time that all required checks (other than "Required review") appearing at the bottom of this PR are passing or skipped.
Then, add the "[Status] Needs Team review" label and ask someone from your team review the code.
Once you’ve done so, switch to the "[Status] Needs Review" label; someone from Jetpack Crew will then review this PR and merge it to be included in the next Jetpack release.`;
	}

	// Gather info about the next release for that plugin.
	const milestoneInfo = await buildMilestoneInfo( octokit, ownerLogin, repo, number );
	if ( milestoneInfo ) {
		comment += milestoneInfo;
	}

	// Look for an existing check-description task comment.
	await postComment( payload, octokit, comment );

	// If some of our checks are failing, remove any "Needs Review" labels and add an Needs Author Reply label.
	if ( comment.includes( ':red_circle:' ) ) {
		await updateLabels( payload, octokit );
	}
}

module.exports = checkDescription;
