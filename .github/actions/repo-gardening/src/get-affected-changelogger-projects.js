const glob = require( 'glob' );
const fs = require( 'fs' );

/**
 * Returns a list of Projects that use changelogger package
 *
 * @returns {Array} list of changelogger packages
 */
function getChangeloggerProjects() {
	const projects = [];
	const composerFiles = glob.sync( process.env.GITHUB_WORKSPACE + '/projects/*/*/composer.json' );
	composerFiles.forEach( file => {
		const json = JSON.parse( fs.readFileSync( file ) );
		if (
			! file.includes( 'changelogger' ) &&
			( json.require[ 'automattic/jetpack-changelogger' ] ||
				json[ 'require-dev' ][ 'automattic/jetpack-changelogger' ] )
		) {
			projects.push( file.split( '/' ).slice( -2 )[ 0 ] );
		}
	} );

	return projects;
}

/**
 * Returns an object with project type and name
 *
 * @param {string} file - File path
 * @returns {object} Project type and name
 */
function getProject( file ) {
	const project = file.match( /projects\/(?<ptype>[^/]*)\/(?<pname>[^/]*)\// );
	if ( project && project.groups.ptype && project.groups.pname ) {
		return { type: project.groups.ptype, name: project.groups.pname };
	}
	return {};
}

/**
 * Returns a list of affected projects
 *
 * @param {Array} files - List of files
 * @returns {Array} List of affected projects
 */
function getAffectedChangeloggerProjects( files ) {
	const changeloggerProjects = getChangeloggerProjects();
	const projects = files.reduce( ( acc, file ) => {
		const project = getProject( file );
		if ( changeloggerProjects.includes( project.name ) ) {
			acc.push( `${ project.type }/${ project.name }` );
		}
		return acc;
	}, [] );

	// Filter out non-unique values
	return [ ...new Set( projects ) ];
}

module.exports = getAffectedChangeloggerProjects;
