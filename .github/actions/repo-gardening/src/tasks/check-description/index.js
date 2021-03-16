/**
 * External dependencies
 */
const moment = require( 'moment' );

/**
 * Internal dependencies
 */
const debug = require( '../../debug' );
const getLabels = require( '../../get-labels' );
const getNextValidMilestone = require( '../../get-next-valid-milestone' );
const getPluginNames = require( '../../get-plugin-names' );

/* global GitHub, WebhookPayloadPullRequest */

/**
 * Check if a PR has unverified commits.
 *
 * @param {GitHub} octokit - Initialized Octokit REST client.
 * @param {string} owner   - Repository owner.
 * @param {string} repo    - Repository name.
 * @param {string} number  - PR number.
 *
 * @returns {Promise<boolean>} Promise resolving to boolean.
 */
async function hasUnverifiedCommit( octokit, owner, repo, number ) {
	for await ( const response of octokit.paginate.iterator( octokit.pulls.listCommits, {
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
 *
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
 *
 * @returns {Promise<boolean>} Promise resolving to boolean.
 */
async function hasNeedsReviewLabel( octokit, owner, repo, number ) {
	const labels = await getLabels( octokit, owner, repo, number );
	// We're really only interested in the Needs review label.
	return !! labels.find( label => label.includes( '[Status] Needs Review' ) );
}

/**
 * Build some info about a specific plugin's release dates.
 *
 * @param {string} plugin        - Plugin name.
 * @param {object} nextMilestone - Information about next milestone as returnde by GitHub.
 *
 * @returns {Promise<string>} Promise resolving to info about the release (code freeze, release date).
 */
async function getMilestoneDates( plugin, nextMilestone ) {
	let releaseDate;
	let codeFreezeDate;
	if ( nextMilestone ) {
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
- Scheduled code freeze: _${ codeFreezeDate }_
`;
}

/**
 * Build a string with info about the next milestone.
 *
 * @param {GitHub} octokit - Initialized Octokit REST client.
 * @param {string} owner   - Repository owner.
 * @param {string} repo    - Repository name.
 * @param {string} number  - PR number.
 *
 * @returns {Promise<string>} Promise resolving to info about the next release for that plugin.
 */
async function buildMilestoneInfo( octokit, owner, repo, number ) {
	const plugins = await getPluginNames( octokit, owner, repo, number );
	let pluginInfo;

	debug( `check-description: This PR impacts the following plugins: ${ plugins.join( ', ' ) }` );

	// Get next valid milestone for each plugin.
	for await ( const plugin of plugins ) {
		const nextMilestone = await getNextValidMilestone( octokit, owner, repo, plugin );
		debug( `check-description: Milestone found: ${ nextMilestone }` );

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
 *
 * @returns {Promise<number>} Promise resolving to boolean.
 */
async function getCheckComment( octokit, owner, repo, number ) {
	let commentID = 0;

	debug( `check-description: Looking for a previous comment from this task in our PR.` );

	for await ( const response of octokit.paginate.iterator( octokit.issues.listComments, {
		owner,
		repo,
		issue_number: +number,
	} ) ) {
		response.data.map( comment => {
			if (
				comment.user.login === 'github-actions[bot]' &&
				comment.body.includes( '**Thank you for your PR!**' )
			) {
				commentID = comment.id;
			}
		} );
	}

	return commentID;
}

/**
 * Checks the contents of a PR description.
 *
 * @param {WebhookPayloadPullRequest} payload - Pull request event payload.
 * @param {GitHub}                    octokit - Initialized Octokit REST client.
 */
async function checkDescription( payload, octokit ) {
	const { base, body, head, number } = payload.pull_request;
	const { name: repo, owner } = payload.repository;
	const ownerLogin = owner.login;

	debug( `check-description: start building our comment` );

	// We'll add any remarks we may have about the PR to that comment body.
	let comment = `**Thank you for your PR!**

When contributing to Jetpack, we have [a few suggestions](https://github.com/Automattic/jetpack/blob/master/.github/PULL_REQUEST_TEMPLATE.md) that can help us test and review your patch:<br>`;

	// No PR is too small to include a description of why you made a change
	const hasLongDescription = body.length > 200;
	comment += `
- ${
		! hasLongDescription ? `:red_circle:` : `:white_check_mark:`
	} Include a description of your PR changes.<br>`;

	// Check all commits in PR.
	// In this case, we use a different failure icon, as we do not consider this a blocker, it should not trigger label changes.
	const isDirty = await hasUnverifiedCommit( octokit, ownerLogin, repo, number );
	comment += `
- ${ isDirty ? `:x:` : `:white_check_mark:` } All commits were linted before commit.<br>`;

	// Use labels please!
	// Only check this for PRs created by a12s. External contributors cannot add labels.
	if ( head.repo.full_name === base.repo.full_name ) {
		const isLabeled = await hasStatusLabels( octokit, ownerLogin, repo, number );
		debug( `check-description: this PR is correctly labeled: ${ isLabeled }` );
		comment += `
- ${
			! isLabeled ? `:red_circle:` : `:white_check_mark:`
		} Add a "[Status]" label (In Progress, Needs Team Review, ...).<br>`;
	}

	// Check for testing instructions.
	const hasTesting = body.includes( 'Testing instructions' );
	comment += `
- ${ ! hasTesting ? `:red_circle:` : `:white_check_mark:` } Add testing instructions.<br>`;

	// Check if the Privacy section is filled in.
	const hasPrivacy = body.includes( 'data or activity we track or use' );
	comment += `
- ${
		! hasPrivacy ? `:red_circle:` : `:white_check_mark:`
	} Specify whether this PR includes any changes to data or privacy.<br>`;

	debug( `check-description: privacy checked. our comment so far is ${ comment }` );

	comment += `


This comment will be updated as you work on your PR and make changes. If you think that some of those checks are not needed for your PR, please explain why you think so. Thanks for cooperation :robot:

******`;

	// If some of the tests are failing, display list of things that could be updated in the PR description to fix things.
	const recommendations = `
${
	! hasLongDescription
		? `Please edit your PR description and explain what functional changes your PR includes, and why those changes are needed.`
		: ''
}
${
	! hasPrivacy
		? `We would recommend that you add a section to the PR description to specify whether this PR includes any changes to data or privacy, like so:
~~~
#### Does this pull request change what data or activity we track or use?

My PR adds *x* and *y*.
~~~`
		: ''
}
${
	! hasTesting
		? `Please include detailed testing steps, explaining how to test your change, like so:
~~~
#### Testing instructions:

* Go to '..'
*
~~~`
		: ''
}
`;

	// If we have some recommendations, add them to our comment.
	if (
		// Remove line breaks from the string to facilitate checking if not empty.
		recommendations.replace( /\r?\n|\r/g, '' ).length > 0
	) {
		comment += `${ recommendations }

******
`;
	}

	// Display extra info for Automatticians (who can handle labels and who created the PR without a fork).
	if ( head.repo.full_name === base.repo.full_name ) {
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
	const existingComment = await getCheckComment( octokit, ownerLogin, repo, number );

	// If there is a comment already, update it.
	if ( existingComment !== 0 ) {
		debug( `check-description: update comment ID ${ existingComment } with our new remarks` );
		await octokit.issues.updateComment( {
			owner: ownerLogin,
			repo,
			comment_id: +existingComment,
			body: comment,
		} );
	} else {
		// If no comment was published before, publish one now.
		debug( `check-description: Posting comment to PR #${ number }` );

		await octokit.issues.createComment( {
			owner: ownerLogin,
			repo,
			issue_number: +number,
			body: comment,
		} );
	}

	// If some of our checks are failing, remove any "Needs Review" labels and add an Needs Author Reply label.
	if ( comment.includes( ':red_circle:' ) ) {
		debug( `check-description: some of the checks are failing. Update labels accordingly.` );

		const hasNeedsReview = await hasNeedsReviewLabel( octokit, ownerLogin, repo, number );
		if ( hasNeedsReview ) {
			debug( `check-description: remove existing Needs review label.` );
			await octokit.issues.removeLabel( {
				owner: ownerLogin,
				repo,
				issue_number: +number,
				name: '[Status] Needs Review',
			} );
		}

		debug( `check-description: add Needs Author Reply label.` );
		await octokit.issues.addLabels( {
			owner: ownerLogin,
			repo,
			issue_number: +number,
			labels: [ '[Status] Needs Author Reply' ],
		} );
	}
}

module.exports = checkDescription;
