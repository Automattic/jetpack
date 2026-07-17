/**
 * Given a commit object, returns the pull request number associated with
 * the commit, or null if an associated pull request cannot be determined.
 *
 * @param commit         - Commit object.
 * @param commit.message - Commit message.
 * @return Pull request number, or null if it cannot be determined.
 */
function getAssociatedPullRequest( commit: { message: string } ): number | null {
	const match = commit.message.match( /\(#(\d+)\)$/m );
	return match && Number( match[ 1 ] );
}

export default getAssociatedPullRequest;
