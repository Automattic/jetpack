const debug = require( '../../debug' );
const getComments = require( '../../get-comments' );

/* global GitHub, WebhookPayloadIssue */

/**
 * Search for a previous comment from this task in our issue.
 *
 * @param {Array} issueComments - Array of all comments on that issue.
 * @returns {Promise<number>} Promise resolving to a number.
 */
async function getListComment( issueComments ) {
	let commentID = 0;

	debug( `gather-support-references: Looking for a previous comment from this task in our issue.` );

	issueComments.map( comment => {
		if (
			comment.user.login === 'github-actions[bot]' &&
			comment.body.includes( '**Support References**' )
		) {
			commentID = comment.id;
		}
	} );

	return commentID;
}

/**
 * Scan the contents of the issue as well as all its comments, get all support references, and add them to an array of references.
 *
 * @param {GitHub} octokit      - Initialized Octokit REST client.
 * @param {string} owner        - Repository owner.
 * @param {string} repo         - Repository name.
 * @param {string} number       - Issue number.
 * @param {Array} issueComments - Array of all comments on that issue.
 * @returns {Promise<Array>} Promise resolving to an array.
 */
async function getIssueReferences( octokit, owner, repo, number, issueComments ) {
	const ticketReferences = [];
	const supportIds = [];
	const referencesRegexP = /[0-9]*-(?:chat|hc|zen|zd)/gim;

	debug( `gather-support-references: Getting references from comments.` );
	issueComments.map( comment => {
		if (
			comment.user.login !== 'github-actions[bot]' ||
			! comment.body.includes( '**Support References**' )
		) {
			ticketReferences.push( ...comment.body.matchAll( referencesRegexP ) );
		}
	} );

	debug( `gather-support-references: Getting references from issue body.` );
	const {
		data: { body },
	} = await octokit.rest.issues.get( {
		owner: owner.login,
		repo,
		issue_number: +number,
	} );
	ticketReferences.push( ...body.matchAll( referencesRegexP ) );

	// Buid a first array with only the support IDs we've collected.
	ticketReferences.map( reference => {
		supportIds.push( reference[ 0 ] );
	} );

	// That array can still include duplicates, or references that are not formatted quite properly.
	// Let's build a final array with unique and correct support IDs.
	const correctedSupportIds = new Set();
	supportIds.map( supportId => {
		// xxx-zen and xxx-hc are the preferred formats for tickets and chats.
		// xxx-zd and xxx-chat, as well as uppercase versions, are considered as alternate versions.
		const wrongId = supportId.match( /([0-9]*)-(zd|chat)/i );
		if ( wrongId ) {
			const correctedId = `${ wrongId[ 1 ] }-${ wrongId[ 2 ].toLowerCase() === 'zd' ? 'zen' : 'hc' }`;
			correctedSupportIds.add( correctedId );
		} else {
			correctedSupportIds.add( supportId.toLowerCase() );
		}
	} );

	return [ ...correctedSupportIds ];
}

/**
 * Creates or updates a comment on issue.
 *
 * @param {WebhookPayloadIssue} payload - Issue event payload.
 * @param {GitHub} octokit              - Initialized Octokit REST client.
 * @param {Array} issueReferences       - Array of support references.
 * @param {Array} issueComments         - Array of all comments on that issue.
 */
async function createOrUpdateComment( payload, octokit, issueReferences, issueComments ) {
	const { issue, repository } = payload;
	const { number } = issue;
	const { name: repo, owner } = repository;
	const ownerLogin = owner.login;

	const comment = `**Support References**
	${ issueReferences
		.map(
			reference => `
- [ ] ${ reference }`
		)
		.join( '' ) }

	`;

	const commentOpts = {
		owner: ownerLogin,
		repo,
		body: comment,
	};

	const existingComment = await getListComment( issueComments );

	// If there is a comment already, update it.
	if ( existingComment !== 0 ) {
		debug(
			`gather-support-references: update comment ID ${ existingComment } with our new list of references.`
		);
		await octokit.rest.issues.updateComment( {
			...commentOpts,
			comment_id: +existingComment,
		} );
	} else {
		// If no comment was published before, publish one now.
		debug( `gather-support-references: Posting comment to issue #${ number }` );
		await octokit.rest.issues.createComment( {
			...commentOpts,
			issue_number: +number,
		} );
	}
}

/**
 * Post or update a comment with a to-do list of all support references on that issue.
 *
 * @param {WebhookPayloadIssue} payload - Issue or issue comment event payload.
 * @param {GitHub}              octokit - Initialized Octokit REST client.
 */
async function gatherSupportReferences( payload, octokit ) {
	const { issue, repository } = payload;
	const { number } = issue;
	const { name: repo, owner } = repository;

	const issueComments = await getComments( octokit, owner.login, repo, number );
	const issueReferences = await getIssueReferences( octokit, owner, repo, number, issueComments );
	if ( issueReferences.length > 0 ) {
		debug( `gather-support-references: Found ${ issueReferences.length } references.` );
		await createOrUpdateComment( payload, octokit, issueReferences, issueComments );
	}
}

module.exports = gatherSupportReferences;
