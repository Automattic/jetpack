const deFusionedFiles = require( './de-fusioned-files.js' );
const getCheckComments = require( './get-check-comments.js' );

/* global GitHub, Core */

/**
 * Does the PR touches any files that have been De-Fusioned?
 *
 * @param {GitHub} github  - Initialized Octokit REST client.
 * @param {string} owner   - Repository owner.
 * @param {string} repo    - Repository name.
 * @param {string} number  - PR number.
 * @param {Core}   core    - A reference to the @actions/core package
 * @returns {Promise<boolean>} Promise resolving to a boolean if the PR touches Fusioned files.
 */
async function isTouchingDeFusionedFiles( github, owner, repo, number, core ) {
	const fileList = [];

	core.debug( `Build: Get list of files modified in #${ number }.` );

	for await ( const response of github.paginate.iterator( github.rest.pulls.listFiles, {
		owner,
		repo,
		pull_number: +number,
		per_page: 100,
	} ) ) {
		response.data.map( file => {
			fileList.push( file.filename );
			if ( file.previous_filename ) {
				fileList.push( file.previous_filename );
			}
		} );
	}

	core.debug(
		`Build: compare the list of files modified in #${ number } with the list of De-Fusioned files.`
	);

	return fileList.some( file => {
		return deFusionedFiles.some( deFusionFile => {
			return file.startsWith( deFusionFile );
		} );
	} );
}

/**
 * Check if there is already a test reminder comment on the PR.
 * If there is, delete it if it is not needed anymore.
 * If there isn't, create one if it is needed.
 *
 * A test reminder comment is needed when
 * the PR touches files that are on the de-fusioned list.
 *
 * @param {github} github  - Pre-authenticated octokit/rest.js client with pagination plugins
 * @param {Object} context - Context of the workflow run
 * @param {core}   core    - A reference to the @actions/core package
 * @returns {Promise<number>} Promise resolving to a comment ID, or 0 if no comment is found.
 */
async function checkTestReminderComment( github, context, core ) {
	const { repo, issue } = context;
	const { owner, repo: repoName } = repo;
	const { TEST_COMMENT_INDICATOR } = process.env;

	// Check if one of the files modified in this PR has been de-fusioned,
	// and thus must now be tested on WordPress.com.
	const touchesDeFusionedFiles = await isTouchingDeFusionedFiles(
		github,
		owner,
		repoName,
		issue.number,
		core
	);

	core.debug(
		`Build: This PR ${
			touchesDeFusionedFiles ? 'touches' : 'does not touch'
		} files that have been de-fusioned and now need to be tested on WordPress.com.`
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

	// This PR does not touch de-fusioned files.
	if ( ! touchesDeFusionedFiles ) {
		// If it previously touched Jetpack, delete the comments that were created then.
		if ( testCommentIDs.length > 0 ) {
			core.debug(
				`Build: this PR previously touched Jetpack de-fusioned files, but does not anymore. Deleting previous test reminder comments.`
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

		return 0;
	}

	// If our PR touches Jetpack, and there was previously a test reminder comment, return it.
	// There should normally only be one comment, but we need to handle the case where there would be more.
	// If so, we'll only take care of the first one.
	if ( testCommentIDs.length > 0 ) {
		core.debug(
			`Build: this PR touches Jetpack, and there was previously a test reminder comment, ${ testCommentIDs[ 0 ] }.`
		);
		return testCommentIDs[ 0 ];
	}

	// If our PR touches Jetpack, and there has been no test reminder comment yet, create one.
	if ( testCommentIDs.length === 0 ) {
		core.debug(
			`Build: this PR touches Jetpack, and there has been no test reminder comment yet. Creating one.`
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
		core.debug( `Build: created test reminder comment with ID ${ id }.` );
		return id;
	}

	// Fallback. No comment exists, or was created.
	core.debug( `Build: final fallback. No comment exists, or was created. We should not get here.` );
	return 0;
}

module.exports = checkTestReminderComment;
