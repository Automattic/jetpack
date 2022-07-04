const debug = require( '../../debug' );

/* global GitHub, WebhookPayloadIssue */

/**
 * Find specific plugin impacted by issue, based off issue contents.
 *
 * @param {string} body - The issue or PR comment content.
 * @returns {string} Issue or PR comment with proper Automattic shorthand.
 */
function replaceIncorrectShorthand( body ) {
	let updatedBody;

	const regexForIncorrectHappychatAtTheStart = /(hc|HC)-(\d+)/gm;
	const regexForIncorrectHappychatAtTheEnd = /(\d+)-HC/gm;
	const regexForIncorrectZendeskAtTheStart = /(zd|ZD|zd-woothemes|ZD-woothemes)-(\d+)/gm;
	const regexForIncorrectZendeskAtTheEnd = /(\d+)-(ZD-woothemes|zd|ZD)/gm;

	updatedBody = body.replace( regexForIncorrectHappychatAtTheStart, '$2-hc' );
	updatedBody = updatedBody.replace( regexForIncorrectHappychatAtTheEnd, '$1-hc' );
	updatedBody = updatedBody.replace( regexForIncorrectZendeskAtTheStart, '$2-zen' );
	updatedBody = updatedBody.replace( regexForIncorrectZendeskAtTheEnd, '$1-zen' );

	return updatedBody;
}

/**
 * Fix shorthand on issue comments to make the shorthand compatible for Automattic userscripts
 *
 * @param {WebhookPayloadIssue} payload - Issue or PR comment event payload.
 * @param {GitHub}              octokit - Initialized Octokit REST client.
 */
async function fixShorthand( payload, octokit ) {
	const { comment, repository } = payload;
	const { id } = comment;
	const { owner } = repository;

	debug( `fix-shorthand: Fixing all incorrect shorthand on the issue comment with the ID ${ id }` );

	await octokit.rest.issues.updateComment( {
		owner: owner.login,
		repo: repository.name,
		comment_id: id,
		body: replaceIncorrectShorthand( comment.body ),
	} );
}

module.exports = fixShorthand;
