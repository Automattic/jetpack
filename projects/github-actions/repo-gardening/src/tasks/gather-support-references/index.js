const debug = require( '../../debug' );
const getComments = require( '../../get-comments' );

/* global GitHub, WebhookPayloadIssue */

/**
 * Search for a previous comment from this task in our issue.
 *
 * @param {Array} issueComments - Array of all comments on that issue.
 * @returns {Promise<Object>} Promise resolving to an object of information about our comment.
 */
async function getListComment( issueComments ) {
	let commentInfo = {};

	debug( `gather-support-references: Looking for a previous comment from this task in our issue.` );

	issueComments.map( comment => {
		if (
			comment.user.login === 'github-actions[bot]' &&
			comment.body.includes( '**Support References**' )
		) {
			commentInfo = {
				id: comment.id,
				body: comment.body,
			};
		}
	} );

	return commentInfo;
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
	const referencesRegexP = /[0-9]*-(?:chat|hc|zen|zd)/gim;

	debug( `gather-support-references: Getting references from issue body.` );
	const {
		data: { body },
	} = await octokit.rest.issues.get( {
		owner: owner.login,
		repo,
		issue_number: +number,
	} );
	ticketReferences.push( ...body.matchAll( referencesRegexP ) );

	debug( `gather-support-references: Getting references from comments.` );
	issueComments.map( comment => {
		if (
			comment.user.login !== 'github-actions[bot]' ||
			! comment.body.includes( '**Support References**' )
		) {
			ticketReferences.push( ...comment.body.matchAll( referencesRegexP ) );
		}
	} );

	// Let's build a array with unique and correct support IDs, formatted properly.
	const correctedSupportIds = new Set();
	ticketReferences.map( reference => {
		const supportId = reference[ 0 ];

		// xxx-zen and xxx-hc are the preferred formats for tickets and chats.
		// xxx-zd and xxx-chat, as well as uppercase versions, are considered as alternate versions.
		const wrongId = supportId.match( /([0-9]*)-(zd|chat)/i );
		if ( wrongId ) {
			const correctedId = `${ wrongId[ 1 ] }-${
				wrongId[ 2 ].toLowerCase() === 'zd' ? 'zen' : 'hc'
			}`;
			correctedSupportIds.add( correctedId );
		} else {
			correctedSupportIds.add( supportId.toLowerCase() );
		}
	} );

	return [ ...correctedSupportIds ];
}

/**
 * Build a comment body with a to-do list of all support references on that issue.
 *
 * @param {Array} issueReferences - Array of support references.
 * @param {Set}   checkedRefs     - Set of support references already checked.
 * @returns {string} Comment body.
 */
function buildCommentBody( issueReferences, checkedRefs = new Set() ) {
	const commentBody = `**Support References**
${ issueReferences
	.map(
		reference => `
- [${ checkedRefs.has( reference ) ? 'x' : ' ' }] ${ reference }`
	)
	.join( '' ) }
`;

	return commentBody;
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

	const existingComment = await getListComment( issueComments );

	// If there is a comment already, update it.
	if ( existingComment.id && existingComment.body ) {
		debug(
			`gather-support-references: update comment ID ${ existingComment.id } with our new list of references.`
		);

		// First, build a list of all references and whether they are checked or not.
		const listWithStatusMatch = existingComment.body.matchAll( /^-\s\[x\]\s(\S+)/gm );

		// Extract the checked ticket references.
		const checkedRefs = new Set();
		for ( const referenceStatus of listWithStatusMatch ) {
			checkedRefs.add( referenceStatus[ 1 ] );
		}

		// Build our comment body, with first the checked references, then the unchecked references.
		const updatedComment = buildCommentBody( issueReferences, checkedRefs );

		await octokit.rest.issues.updateComment( {
			owner: ownerLogin,
			repo,
			body: updatedComment,
			comment_id: +existingComment.id,
		} );
	} else {
		// If no comment was published before, publish one now.
		debug( `gather-support-references: Posting comment to issue #${ number }` );

		const comment = buildCommentBody( issueReferences );

		await octokit.rest.issues.createComment( {
			owner: ownerLogin,
			repo,
			body: comment,
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
