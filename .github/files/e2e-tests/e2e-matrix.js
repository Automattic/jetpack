const { execSync } = require( 'child_process' );
const fs = require( 'fs' );

const projects = [
	{
		project: 'Jetpack connection',
		path: 'projects/plugins/jetpack/tests/e2e',
		testArgs: [ 'specs/connection', '--retries=1' ],
	},
	{
		project: 'Jetpack pre-connection',
		path: 'projects/plugins/jetpack/tests/e2e',
		testArgs: [ 'specs/pre-connection', '--retries=1' ],
	},
	{
		project: 'Jetpack post-connection',
		path: 'projects/plugins/jetpack/tests/e2e',
		testArgs: [ 'specs/post-connection', '--retries=1' ],
	},
	{
		project: 'Jetpack sync',
		path: 'projects/plugins/jetpack/tests/e2e',
		testArgs: [ 'specs/sync', '--retries=1' ],
	},
	{
		project: 'Jetpack blocks',
		path: 'projects/plugins/jetpack/tests/e2e',
		testArgs: [ 'specs/blocks', '--retries=1' ],
	},
	{ project: 'Boost', path: 'projects/plugins/boost/tests/e2e', testArgs: [] },
	{ project: 'Search', path: 'projects/plugins/search/tests/e2e', testArgs: [] },
	{ project: 'VideoPress', path: 'projects/plugins/videopress/tests/e2e', testArgs: [] },
	{ project: 'Social', path: 'projects/plugins/social/tests/e2e', testArgs: [] },
];

const runConfig = { run: '', matrix: [] };

switch ( process.env.GITHUB_EVENT_NAME ) {
	case 'pull_request':
	case 'push': {
		const changedProjects = JSON.parse(
			execSync( '.github/files/list-changed-projects.sh' ).toString()
		);

		for ( const project of projects ) {
			const packageJson = JSON.parse( fs.readFileSync( `${ project.path }/package.json`, 'utf8' ) );

			if ( packageJson?.ci?.targets?.length > 0 ) {
				// iterate over defined target plugins/projects and see if they are changed
				for ( const target of packageJson.ci.targets ) {
					if ( Object.keys( changedProjects ).includes( target ) ) {
						runConfig.matrix.push( project );
						break;
					}
				}
			} else {
				// if no targets are defined, run the tests
				runConfig.matrix.push( project );
			}
		}
		break;
	}
	case 'workflow_run': {
		runConfig.matrix.push( ...projects );
		break;
	}
	case 'repository_dispatch':
		if ( process.env.DISPATCH_REPO ) {
			const repoName = process.env.DISPATCH_REPO.split( '/' )[ 1 ];
			runConfig.run = repoName;

			for ( const project of projects ) {
				const packageJson = JSON.parse(
					fs.readFileSync( `${ project.path }/package.json`, 'utf8' )
				);

				if ( packageJson?.ci?.mirrorName === repoName ) {
					runConfig.matrix.push( project );
				}
			}
		} else {
			// eslint-disable-next-line no-console
			console.error( 'Undefined DISPATCH_REPO!' );
		}
		break;
	case 'schedule':
		// gutenberg scheduled run
		if ( process.env.CRON === '0 */12 * * *' ) {
			runConfig.matrix.push( {
				project: 'Jetpack with Gutenberg',
				path: 'projects/plugins/jetpack/tests/e2e',
				testArgs: [ 'blocks', '--retries=1' ],
			} );
		}

		// atomic scheduled run
		if ( process.env.CRON === '30 */4 * * *' ) {
			runConfig.matrix.push( {
				project: 'Jetpack on Atomic',
				path: 'projects/plugins/jetpack/tests/e2e',
				testArgs: [ 'blocks', '--retries=1' ],
			} );
		}
		break;
	default:
		// eslint-disable-next-line no-console
		console.error( `Unsupported GITHUB_EVENT_NAME ${ process.env.GITHUB_EVENT_NAME }.` );
}

// eslint-disable-next-line no-console
console.log( JSON.stringify( runConfig ) );
