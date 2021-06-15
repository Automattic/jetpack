/* global WebhookPayloadPushCommit */

/**
 * Given a commit object, returns a promise resolving with the pull request
 * number associated with the commit, or null if an associated pull request
 * cannot be determined.
 *
 * @param {WebhookPayloadPushCommit} commit - Commit object.
 *
 * @returns {number?} Pull request number, or null if it cannot be determined.
 */
function getAssociatedPullRequest( commit ) {
	const match = commit.message.match( /\(#(\d+)\)$/m );
	return match && Number( match[ 1 ] );
}

module.exports = getAssociatedPullRequest;
