import path from 'path';
import moment from 'moment';
import debug from '../../utils/debug.ts';
import getAffectedChangeloggerProjects from '../../utils/get-affected-changelogger-projects.ts';
import getComments from '../../utils/get-comments.ts';
import getFiles from '../../utils/get-files.ts';
import getNextValidMilestone from '../../utils/get-next-valid-milestone.ts';
import getPluginNames from '../../utils/get-plugin-names.ts';
import getPrWorkspace from '../../utils/get-pr-workspace.ts';
import getLabels from '../../utils/labels/get-labels.ts';
import { safeJsonParse, safeReadFileSync } from '../../utils/safe-read-file.ts';
import type { OctokitClient, PullRequestEvent } from '../../types.ts';

/**
 * Milestone information used by getMilestoneDates.
 */
interface MilestoneInfo {
	description?: string | null;
	due_on?: string | null;
	[ key: string ]: unknown;
}

/**
 * Status check results from getStatusChecks.
 */
interface StatusChecks {
	hasLongDescription: boolean;
	hasStatusLabels: boolean;
	hasTesting: boolean;
	hasPrivacy: boolean;
	projectsWithoutChangelog: string[];
	hasChangelogEntries: boolean;
	isFromContributor: boolean;
	[ key: string ]: unknown;
}

/**
 * Check for a "Need Review" label on a PR.
 *
 * @param octokit - Initialized Octokit REST client.
 * @param owner   - Repository owner.
 * @param repo    - Repository name.
 * @param number  - PR number.
 * @return Promise resolving to boolean.
 */
async function hasNeedsReviewLabel(
	octokit: OctokitClient,
	owner: string,
	repo: string,
	number: number
): Promise< boolean > {
	const labels = await getLabels( octokit, owner, repo, number );
	// We're really only interested in the Needs review label.
	return !! labels.find( label => label.includes( '[Status] Needs Review' ) );
}

/**
 * Check for a "In Progress" status label on a PR.
 *
 * @param octokit - Initialized Octokit REST client.
 * @param owner   - Repository owner.
 * @param repo    - Repository name.
 * @param number  - PR number.
 * @return Promise resolving to boolean.
 */
async function hasProgressLabel(
	octokit: OctokitClient,
	owner: string,
	repo: string,
	number: number
): Promise< boolean > {
	const labels = await getLabels( octokit, owner, repo, number );
	// We're really only interested in the In Progress label.
	return labels.includes( '[Status] In Progress' );
}

/**
 * Build some info about a specific plugin's release dates.
 *
 * @param plugin        - Plugin name.
 * @param nextMilestone - Information about next milestone as returned by GitHub.
 * @return Promise resolving to info about the release (code freeze, release date).
 */
async function getMilestoneDates(
	plugin: string,
	nextMilestone: MilestoneInfo | undefined
): Promise< string > {
	let releaseDate: string | undefined;
	let codeFreezeDate: string | undefined;
	if ( nextMilestone && Object.hasOwn( nextMilestone, 'due_on' ) && nextMilestone.due_on ) {
		releaseDate = moment( nextMilestone.due_on ).format( 'LL' );

		// Look for a code freeze date in the milestone description.
		const dateRegex = /^(?:Code Freeze|Branch Cut): (\d{4}-\d{2}-\d{2})\s*$/m;
		const freezeDateDescription = nextMilestone.description?.match( dateRegex );

		// If we have a date and it is valid, use it, otherwise set code freeze to a week before the release.
		if ( freezeDateDescription && moment( freezeDateDescription[ 1 ] ).isValid() ) {
			codeFreezeDate = moment( freezeDateDescription[ 1 ] ).format( 'LL' );
		}
	} else if ( plugin === 'wpcomsh' ) {
		releaseDate = 'Atomic deploys happen twice daily on weekdays (p9o2xV-2EN-p2)';
	} else if ( plugin === 'mu-wpcom' ) {
		releaseDate = 'WordPress.com Simple releases happen semi-continuously (PCYsg-Jjm-p2)';
	}

	const capitalizedName = plugin
		.split( '-' )
		// Capitalize first letter of each word.
		.map( word => `${ word[ 0 ].toUpperCase() }${ word.slice( 1 ) }` )
		// Spaces between words.
		.join( ' ' );

	let pluginMessage;
	if ( ! releaseDate ) {
		pluginMessage = `No scheduled milestone found for this plugin.`;
	} else if ( plugin === 'jetpack' ) {
		pluginMessage = `The Jetpack plugin has different release cadences depending on the platform:

- WordPress.com Simple releases happen as soon as you deploy your changes after merging this PR (PCYsg-Jjm-p2).
- WoA releases happen weekly.
- Releases to self-hosted sites happen monthly:
    - Scheduled release: _${ releaseDate }_
${ codeFreezeDate ? `    - Code freeze: _${ codeFreezeDate }_` : '' }
`;
	} else {
		pluginMessage = `- Next scheduled release: _${ releaseDate }_
${ codeFreezeDate ? `- Code freeze: _${ codeFreezeDate }_` : '' }`;
	}

	return `
******

**${ capitalizedName } plugin:**

${ pluginMessage }

If you have any questions about the release process, please ask in the #jetpack-releases channel on Slack.
`;
}

/**
 * Build a string with info about the next milestone.
 *
 * @param octokit - Initialized Octokit REST client.
 * @param owner   - Repository owner.
 * @param repo    - Repository name.
 * @param number  - PR number.
 * @return Promise resolving to info about the next release for that plugin.
 */
async function buildMilestoneInfo(
	octokit: OctokitClient,
	owner: string,
	repo: string,
	number: number
): Promise< string > {
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
 * @param octokit - Initialized Octokit REST client.
 * @param owner   - Repository owner.
 * @param repo    - Repository name.
 * @param number  - PR number.
 * @return Promise resolving to the comment ID, or 0 if not found.
 */
async function getCheckComment(
	octokit: OctokitClient,
	owner: string,
	repo: string,
	number: number
): Promise< number > {
	let commentID = 0;

	debug( `check-description: Looking for a previous comment from this task in our PR.` );

	const comments = await getComments( octokit, owner, repo, number );
	for ( const comment of comments ) {
		if (
			comment.user.login === 'github-actions[bot]' &&
			comment.body.includes( '**Thank you for your PR!**' )
		) {
			commentID = comment.id;
		}
	}

	return commentID;
}

/**
 * Compose a list item with appropriate status check and passed message
 *
 * @param isFailure    - Boolean condition to determine if check failed.
 * @param checkMessage - Sentence describing successful check.
 * @param severity     - Optional. Check severity. Could be one of `error`, `warning`, `notice`.
 * @return List item with status emoji and a sentence describing check.
 */
function statusEntry(
	isFailure: boolean,
	checkMessage: string,
	severity: string = 'error'
): string {
	const severityMap: Record< string, string > = {
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
 * @param octokit - Initialized Octokit REST client.
 * @param owner   - Repository owner.
 * @param repo    - Repository name.
 * @param number  - PR number.
 * @return List of affected projects without changelog entry.
 */
async function getChangelogEntries(
	octokit: OctokitClient,
	owner: string,
	repo: string,
	number: number
): Promise< string[] > {
	const baseDir = getPrWorkspace();
	const files = await getFiles( octokit, owner, repo, number );
	const affectedProjects = getAffectedChangeloggerProjects( files );
	debug( `check-description: affected changelogger projects: ${ affectedProjects }` );

	return affectedProjects.reduce( ( acc: string[], project: string ) => {
		const composerFile = `${ baseDir }/projects/${ project }/composer.json`;
		const json = safeJsonParse( safeReadFileSync( composerFile, baseDir ), composerFile ) as Record<
			string,
			Record< string, Record< string, string > >
		>;
		// Changelog directory could be customized via .extra.changelogger.changes-dir in composer.json. Lets check for it.
		const changelogDir =
			path.relative(
				baseDir,
				path.resolve(
					`${ baseDir }/projects/${ project }`,
					( json.extra && json.extra.changelogger && json.extra.changelogger[ 'changes-dir' ] ) ||
						'changelog'
				)
			) + '/';
		// Changelog file could also be customized via .extra.changelogger.changelog in composer.json. Lets check for it.
		const changelogFile = path.relative(
			baseDir,
			path.resolve(
				`${ baseDir }/projects/${ project }`,
				( json.extra && json.extra.changelogger && json.extra.changelogger.changelog ) ||
					'CHANGELOG.md'
			)
		);
		const found = files.find( file => file === changelogFile || file.startsWith( changelogDir ) );
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
 * - Missing `[Status]` label
 * - Missing "Testing instructions"
 * - Missing Changelog entry
 * - Privacy section
 *
 * Note: All the checks should be truthy to resolve as success check.
 *
 * @param payload - Pull request event payload.
 * @param octokit - Initialized Octokit REST client.
 * @return Status checks object with check results.
 */
async function getStatusChecks(
	payload: PullRequestEvent,
	octokit: OctokitClient
): Promise< StatusChecks > {
	const { body, number, head, base } = payload.pull_request;
	const { name: repo, owner } = payload.repository;
	const ownerLogin = owner.login;

	const hasLongDescription = ( body?.length ?? 0 ) > 200;
	const hasTesting = !! body?.includes( 'Testing instructions' );
	const hasPrivacy = !! body?.includes( 'data or activity we track or use' );
	const projectsWithoutChangelog = await getChangelogEntries( octokit, ownerLogin, repo, number );
	const isFromContributor = head.repo?.full_name === base.repo.full_name;

	const prLabels = await getLabels( octokit, ownerLogin, repo, number );
	// We're only interested in status labels, but not the "Needs Reply" label since it can be added by the action.
	const hasStatusLabels = prLabels.some( label =>
		label.match( /^\[Status\].*(?<!Author Reply)$/ )
	);

	return {
		hasLongDescription,
		hasStatusLabels,
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
 * @param statusChecks - Map of all checks with boolean as a value.
 * @return Part of the comment with list of checks.
 */
function renderStatusChecks( statusChecks: StatusChecks ): string {
	// No PR is too small to include a description of why you made a change
	let checks = statusEntry(
		! statusChecks.hasLongDescription,
		'Include a description of your PR changes.'
	);

	// Use labels please!
	// Only check this for PRs created by a12s. External contributors cannot add labels.
	if ( statusChecks.isFromContributor ) {
		debug( `check-description: this PR has a Status label: ${ statusChecks.hasStatusLabels }` );
		checks += statusEntry(
			! statusChecks.hasStatusLabels,
			'Add a "[Status]" label (In Progress, Needs Review, ...).'
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
 * @param statusChecks - Map of all checks with boolean as a value.
 * @return Part of the comment with recommendations.
 */
function renderRecommendations( statusChecks: StatusChecks ): string {
	const recommendations: Record< string, string > = {
		hasLongDescription:
			'Please edit your PR description and explain what functional changes your PR includes, and why those changes are needed.',
		hasPrivacy: `We would recommend that you add a section to the PR description to specify whether this PR includes any changes to data or privacy, like so:
~~~
## Does this pull request change what data or activity we track or use?

My PR adds *x* and *y*.
~~~`,
		hasTesting: `Please include detailed testing steps, explaining how to test your change, like so:
~~~
## Testing instructions:

* Go to '..'
*
~~~`,
		hasChangelogEntries: `Please add missing changelog entries for the following projects: \`${ statusChecks.projectsWithoutChangelog.join(
			'`, `'
		) }\`

Use [the Jetpack CLI tool](https://github.com/Automattic/jetpack/blob/trunk/docs/monorepo.md#first-time) to generate changelog entries by running the following command: \`jetpack changelog add\`.
${
	statusChecks.isFromContributor
		? 'Alternatively, you can check the "Generate changelog entries" checkbox in the PR description to have them auto-generated.\n'
		: ''
}Guidelines: [/docs/writing-a-good-changelog-entry.md](https://github.com/Automattic/jetpack/blob/trunk/docs/writing-a-good-changelog-entry.md)
`,
	};

	// If some of the tests are failing, display list of things that could be updated in the PR description to fix things.
	return Object.keys( statusChecks ).reduce( ( output: string, check: string ) => {
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
 * @param payload - Pull request event payload.
 * @param octokit - Initialized Octokit REST client.
 * @param comment - Comment string.
 */
async function postComment(
	payload: PullRequestEvent,
	octokit: OctokitClient,
	comment: string
): Promise< void > {
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
			comment_id: existingComment,
		} );
	} else {
		// If no comment was published before, publish one now.
		debug( `check-description: Posting comment to PR #${ number }` );
		await octokit.rest.issues.createComment( {
			...commentOpts,
			issue_number: number,
		} );
	}
}

/**
 * Update labels for PRs with failing checks
 *
 * @param payload - Pull request event payload.
 * @param octokit - Initialized Octokit REST client.
 */
async function updateLabels( payload: PullRequestEvent, octokit: OctokitClient ): Promise< void > {
	const { number } = payload.pull_request;
	const { name: repo, owner } = payload.repository;
	const ownerLogin = owner.login;
	const labelOpts = {
		owner: ownerLogin,
		repo,
		issue_number: number,
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
 * @param payload - Pull request event payload.
 * @param octokit - Initialized Octokit REST client.
 */
async function checkDescription(
	payload: PullRequestEvent,
	octokit: OctokitClient
): Promise< void > {
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

	if (
		( ref === 'update/phan-wpcom-stubs' || ref === 'update/phan-custom-stubs' ) &&
		( author === 'matticbot' || author === 'github-actions[bot]' )
	) {
		debug( `check-description: Automated stub update, skipping` );
		return;
	}

	if ( ref === 'update/pnpm_and_composer_lock_files' && author === 'matticbot' ) {
		debug( `check-description: Automated lock file update, skipping` );
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

	comment += renderRecommendations( statusChecks );

	// Display extra info for Automatticians (who can handle labels and who created the PR without a fork).
	if ( statusChecks.isFromContributor ) {
		comment += `

**Follow this PR Review Process:**

1. Ensure all required checks appearing at the bottom of this PR are passing.
2. Make sure to test your changes on all platforms that it applies to. *You're responsible for the quality of the code you ship*.
3. You can use [GitHub's Reviewers functionality](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/requesting-a-pull-request-review) to request a review.
4. When it's reviewed and merged, you will be pinged in Slack to deploy the changes to WordPress.com simple once the build is done.

If you have questions about anything, reach out in #jetpack-developers for guidance!`;
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

export default checkDescription;
