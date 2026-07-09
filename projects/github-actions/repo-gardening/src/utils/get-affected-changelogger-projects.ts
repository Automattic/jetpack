import { glob } from 'glob';
import getPrWorkspace from './get-pr-workspace.ts';

/**
 * Returns a list of Projects that use changelogger package.
 *
 * @return List of changelogger packages.
 */
function getChangeloggerProjects(): string[] {
	const projects: string[] = [];
	const workspace = getPrWorkspace();
	const composerFiles = glob.sync( workspace + '/projects/*/*/composer.json' );
	composerFiles.forEach( file => {
		projects.push( getProject( file ).fullName );
	} );

	return projects;
}

/**
 * Returns an object with project type and name.
 *
 * @param file - File path.
 * @return Project type and name.
 */
function getProject(
	file: string
): { type: string; name: string; fullName: string } | Record< string, never > {
	const project = file.match( /projects\/(?<ptype>[^/]*)\/(?<pname>[^/]*)\// );
	if ( project?.groups?.ptype && project.groups.pname ) {
		return {
			type: project.groups.ptype,
			name: project.groups.pname,
			fullName: `${ project.groups.ptype }/${ project.groups.pname }`,
		};
	}
	return {};
}

/**
 * Returns a list of affected projects.
 *
 * @param files - List of files.
 * @return List of affected projects.
 */
function getAffectedChangeloggerProjects( files: string[] ): string[] {
	const changeloggerProjects = getChangeloggerProjects();
	const projects = files.reduce( ( acc, file ) => {
		const project = getProject( file ).fullName;
		if ( ! file.endsWith( 'CHANGELOG.md' ) && changeloggerProjects.includes( project ) ) {
			acc.add( project );
		}
		return acc;
	}, new Set< string >() );

	return [ ...projects ];
}

export default getAffectedChangeloggerProjects;
