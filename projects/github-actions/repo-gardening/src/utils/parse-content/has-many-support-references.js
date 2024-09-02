const { getInput } = require( '@actions/core' );

/**
 * Check if the issue has a comment with a list of support references,
 * and at least x support references listed there.
 * (x is specified with reply_to_customers_threshold input, default to 10).
 * We only count the number of unanswered support references, since they're the ones we'll need to contact.
 *
 * @param {Array} issueComments - Array of all comments on that issue.
 * @return {Promise<boolean>} Promise resolving to boolean.
 */
async function hasManySupportReferences( issueComments ) {
	const referencesThreshhold = getInput( 'reply_to_customers_threshold' );

	for ( const comment of issueComments ) {
		if (
			comment.user.login === 'github-actions[bot]' &&
			comment.body.includes( '**Support References**' )
		) {
			// Count the number of to-do items in the comment.
			const countReferences = comment.body.split( '- [ ] ' ).length - 1;
			if ( countReferences >= parseInt( referencesThreshhold ) ) {
				return true;
			}
		}
	}

	return false;
}

module.exports = hasManySupportReferences;
