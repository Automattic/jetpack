const fs = require( 'fs' );
const { glob } = require( 'glob' );
const getPrWorkspace = require( './get-pr-workspace' );

/**
 * Returns a list of Projects that use changelogger package
 *
 * @returns {Array} list of changelogger packages
 */
function getChangeloggerProjects() {
	const projects = [];
	const composerFiles = glob.sync( getPrWorkspace() + '/projects/*/*/composer.json' );
	composerFiles.forEach( file => {
		const json = JSON.parse( fs.readFileSync( file ) );
		if (
			// include changelogger package and any other packages that use changelogger package.
			file.endsWith( '/projects/packages/changelogger/composer.json' ) ||
			json.require?.[ 'automattic/jetpack-changelogger' ] ||
			json[ 'require-dev' ]?.[ 'automattic/jetpack-changelogger' ]
		) {
			projects.push( getProject( file ).fullName );
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
		return {
			type: project.groups.ptype,
			name: project.groups.pname,
			fullName: `${ project.groups.ptype }/${ project.groups.pname }`,
		};
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
		const project = getProject( file ).fullName;
		if ( ! file.endsWith( 'CHANGELOG.md' ) && changeloggerProjects.includes( project ) ) {
			acc.add( project );
		}
		return acc;
	}, new Set() );

	return [ ...projects ];
}

module.exports = getAffectedChangeloggerProjects;
