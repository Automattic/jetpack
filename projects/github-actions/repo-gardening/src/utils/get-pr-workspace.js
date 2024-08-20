/**
 * Get the path to the PR workspace.
 *
 * @return {string} Path.
 */
function getPrWorkspace() {
	if ( 'undefined' !== typeof process.env.PR_WORKSPACE ) {
		return process.env.PR_WORKSPACE;
	}

	throw new Error( 'Environment variable PR_WORKSPACE is not defined.' );
}

module.exports = getPrWorkspace;
