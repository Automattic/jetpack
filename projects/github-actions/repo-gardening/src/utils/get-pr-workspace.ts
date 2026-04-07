/**
 * Get the path to the PR workspace.
 *
 * @return Path.
 */
function getPrWorkspace(): string {
	if ( 'undefined' !== typeof process.env.PR_WORKSPACE ) {
		return process.env.PR_WORKSPACE;
	}

	throw new Error( 'Environment variable PR_WORKSPACE is not defined.' );
}

export default getPrWorkspace;
