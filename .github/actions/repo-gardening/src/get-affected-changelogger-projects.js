/* global GitHub */
const glob = require( 'glob' );
const fs = require( 'fs' );

const debug = require( './debug' );
const getFiles = require( './get-files' );

// /**
//  * Get list of files modified in PR.
//  *
//  * @param {GitHub} octokit - Initialized Octokit REST client.
//  * @param {string} owner   - Repository owner.
//  * @param {string} repo    - Repository name.
//  * @param {string} number  - PR number.
//  *
//  * @returns {Promise<Array>} Promise resolving to an array of all files modified in  that PR.
//  */
//  async function getProjects( octokit, owner, repo, number ) {
// 	debug( 'get-projects: Get list of files modified in this PR.' );
// 	const files = await getFiles( octokit, owner, repo, number );

// 	if ( ! files ) {
// 		throw new Error( 'No files were modified in this PR' );
// 	}

// 	debug( 'add-labels: Loop through all files modified in this PR and add matching labels.' );
// }

// /**
//  * @param file
//  */
// async function isProjectFile( file ) {
// 	const project = file.match( /^projects\/(?<ptype>[^/]*)\/(?<pname>[^/]*)\// );
// 		if ( project && project.groups.ptype && project.groups.pname ) {
// 			return true;
// 		}
// 			return false;
// }

// // // Find projects that use changelogger, and read the relevant config.
// // $changelogger_projects = array();
// // foreach ( glob( 'projects/*/*/composer.json' ) as $file ) {
// // 	$data = json_decode( file_get_contents( $file ), true );
// // 	if ( 'projects/packages/changelogger/composer.json' !== $file &&
// // 		! isset( $data['require']['automattic/jetpack-changelogger'] ) &&
// // 		! isset( $data['require-dev']['automattic/jetpack-changelogger'] )
// // 	) {
// // 		continue;
// // 	}
// // 	$data  = isset( $data['extra']['changelogger'] ) ? $data['extra']['changelogger'] : array();
// // 	$data += array(
// // 		'changelog'   => 'CHANGELOG.md',
// // 		'changes-dir' => 'changelog',
// // 	);
// // 	$changelogger_projects[ substr( $file, 9, -14 ) ] = $data;
// // }

/**
 *
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
 * @param file
 */
function getProject( file ) {
	const project = file.match( /^projects\/(?<ptype>[^/]*)\/(?<pname>[^/]*)\// );
	if ( project && project.groups.ptype && project.groups.pname ) {
		return { type: project.groups.ptype, name: project.groups.pname };
	}
	return null;
}

/**
 * @param files
 */
function getAffectedChangeloggerProjects( files ) {
	const changeloggerProjects = getChangeloggerProjects();
	return files.reduce( ( acc, file ) => {
		const project = getProject( file );
		if ( changeloggerProjects.includes( project ) ) {
			acc.push( file );
		}
		return acc;
	}, [] );
}

module.exports = getAffectedChangeloggerProjects;
