const getCheckComments = require( './get-check-comments.js' );

/* global GitHub, Core */

/**
 * Does the PR touch anything that needs testing on WordPress.com.
 *
 * Currently we look whether process.env.CHANGED contains `plugins/jetpack`,
 * meaning that Jetpack is being built, `plugins/mu-wpcom-plugin` for
 * Jetpack-mu-wpcom-plugin, or `plugins/wpcomsh` for wpcomsh.
 *
 * @param {GitHub} github - Initialized Octokit REST client.
 * @param {string} owner  - Repository owner.
 * @param {string} repo   - Repository name.
 * @param {string} number - PR number.
 * @param {Core}   core   - A reference to the @actions/core package
 * @return {Promise} Promise resolving to an object with keys `simple` and `woa`, each being an array of strings identifying what needs testing.
 */
async function touchedProjectsNeedingTesting( github, owner, repo, number, core ) {
	const changed = JSON.parse( process.env.CHANGED );
	const simple = [];
	const woa = [];

	if ( changed[ 'plugins/jetpack' ] ) {
		core.info( 'Build: Jetpack is being built, testing needed' );
		simple.push( 'jetpack' );
		woa.push( 'Jetpack' );
	}

	if ( changed[ 'plugins/mu-wpcom-plugin' ] ) {
		core.info( 'Build: jetpack-mu-wpcom-plugin is being built, testing needed' );
		simple.push( 'jetpack-mu-wpcom-plugin' );
	}

	if ( changed[ 'plugins/wpcomsh' ] ) {
		core.info( 'Build: wpcomsh is being built, testing needed' );
		woa.push( 'WordPress.com Site Helper' );
	}

	if ( ! simple.length && ! woa.length ) {
		core.info( 'Build: Nothing that needs testing was found' );
	}

	return { simple, woa };
}

/**
 * Check if there is already a test pending comment on the PR.
 * If there is, delete it if it is not needed anymore.
 * If there isn't, create one if it is needed.
 *
 * @param {github} github  - Pre-authenticated octokit/rest.js client with pagination plugins
 * @param {object} context - Context of the workflow run
 * @param {core}   core    - A reference to the @actions/core package
 * @return {Promise} Promise resolving to an object with the following properties:
 * - {commentId} - a comment ID, or 0 if no comment is found.
 * - {simple} - an array of strings identifying what needs testing on Simple.
 * - {woa} - an array of strings identifying what needs testing on WoA.
 */
async function checkTestPendingComment( github, context, core ) {
	const { repo, issue } = context;
	const { owner, repo: repoName } = repo;
	const { TEST_COMMENT_INDICATOR } = process.env;

	// Check if one of the files modified in this PR need testing on WordPress.com.
	const data = await touchedProjectsNeedingTesting( github, owner, repoName, issue.number, core );

	core.info(
		`Build: This PR ${
			data.simple.length || data.woa.length ? 'touches' : 'does not touch'
		} something that needs testing on WordPress.com.`
	);

	// Get all the test reminder comments in our PR.
	const testCommentIDs = await getCheckComments(
		github,
		owner,
		repoName,
		issue.number,
		TEST_COMMENT_INDICATOR,
		core
	);

	// This PR does not touch files needing testing.
	if ( ! data.simple.length && ! data.woa.length ) {
		if ( testCommentIDs.length > 0 ) {
			core.info(
				`Build: this PR previously touched something that needs testing, but does not anymore. Deleting previous test reminder comments.`
			);

			await Promise.all(
				testCommentIDs.map( async commentID => {
					await github.rest.issues.deleteComment( {
						owner,
						repo: repoName,
						comment_id: commentID,
					} );
				} )
			);
		}

		data.commentId = 0;
		return data;
	}

	// If our PR needs testing, and there was previously a test reminder comment, return it.
	// There should normally only be one comment, but we need to handle the case where there would be more.
	// If so, we'll only take care of the first one.
	if ( testCommentIDs.length > 0 ) {
		core.info(
			`Build: this PR touches something that needs testing, and there was previously a test reminder comment, ${ testCommentIDs[ 0 ] }.`
		);
		data.commentId = testCommentIDs[ 0 ];
		return data;
	}

	// If our PR touches something that needs testing, and there has been no test reminder comment yet, create one.
	if ( testCommentIDs.length === 0 ) {
		core.info(
			`Build: this PR touches something that needs testing, and there has been no test reminder comment yet. Creating one.`
		);
		const body = `${ TEST_COMMENT_INDICATOR }Are you an Automattician? The PR will need to be tested on WordPress.com. This comment will be updated with testing instructions as soon the build is complete.`;
		const {
			data: { id },
		} = await github.rest.issues.createComment( {
			issue_number: issue.number,
			owner,
			repo: repoName,
			body,
		} );
		core.info( `Build: created test reminder comment with ID ${ id }.` );
		data.commentId = id;
		return data;
	}

	// Fallback. No comment exists, or was created.
	core.notice(
		`Build: final fallback. No comment exists, or was created. We should not get here.`
	);
	data.commentId = 0;
	return data;
}

/**
 * Update the test pending comment to a test reminder comment.
 *
 * @param {github} github  - Pre-authenticated octokit/rest.js client with pagination plugins
 * @param {object} context - Context of the workflow run
 * @param {core}   core    - A reference to the @actions/core package
 * @return {Promise} Promise resolving to an object with the following properties:
 * - {commentId} - a comment ID, or 0 if no comment is found.
 * - {simple} - an array of strings identifying what needs testing on Simple.
 * - {woa} - an array of strings identifying what needs testing on WoA.
 */
async function checkTestReminderComment( github, context, core ) {
	const { BRANCH_NAME, TEST_COMMENT_INDICATOR } = process.env;
	const data = JSON.parse( process.env.DATA );

	core.debug( `Data from earlier step: ${ data }` );

	let woaLine = '';
	let simpleLine = '';

	if ( data.simple.length ) {
		simpleLine =
			`- To test on Simple, run the following command on your sandbox:` +
			data.simple.reduce( ( acc, cur ) => {
				return ( acc += `\n\`\`\`\nbin/jetpack-downloader test ${ cur } ${ BRANCH_NAME }\n\`\`\`` );
			}, '' );
	}
	if ( data.woa.length ) {
		woaLine = `- To test on WoA, go to the Plugins menu on a WoA dev site. Click on the "Upload" button and follow the upgrade flow to be able to upload, install, and activate [the Jetpack Beta plugin](https://jetpack.com/download-jetpack-beta/). Once the plugin is active, go to Jetpack > Jetpack Beta, select your plugin (${ data.woa.join(
			' or '
		) }), and enable the \`${ BRANCH_NAME }\` branch.`;
	}

	const commentBody = `${ TEST_COMMENT_INDICATOR }
	Are you an Automattician? Please test your changes on all WordPress.com environments to help mitigate accidental explosions.

	${ woaLine }
	${ simpleLine }

	*Interested in more tips and information?*

	- In your local development environment, use the \`jetpack rsync\` command to sync your changes to a WoA dev blog.
	- Read more about our development workflow here: PCYsg-eg0-p2
	- Figure out **when your changes will be shipped to customers** here: PCYsg-eg5-p2`.replace(
		/^\t/gm,
		''
	);

	await github.rest.issues.updateComment( {
		owner: context.repo.owner,
		repo: context.repo.repo,
		body: commentBody,
		comment_id: +data.commentId,
	} );
}

module.exports = {
	checkTestPendingComment,
	checkTestReminderComment,
};
