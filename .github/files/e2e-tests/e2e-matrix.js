const { execSync } = require( 'child_process' );
const fs = require( 'fs' );

const projects = [
	{
		project: 'Jetpack connection',
		path: 'projects/plugins/jetpack/tests/e2e',
		testArgs: [ 'specs/connection', '--retries=1' ],
		suite: '',
	},
	{
		project: 'Jetpack pre-connection',
		path: 'projects/plugins/jetpack/tests/e2e',
		testArgs: [ 'specs/pre-connection', '--retries=1' ],
		suite: '',
	},
	{
		project: 'Jetpack post-connection',
		path: 'projects/plugins/jetpack/tests/e2e',
		testArgs: [ 'specs/post-connection', '--retries=1' ],
		suite: '',
	},
	{
		project: 'Jetpack sync',
		path: 'projects/plugins/jetpack/tests/e2e',
		testArgs: [ 'specs/sync', '--retries=1' ],
		suite: '',
	},
	{
		project: 'Jetpack blocks',
		path: 'projects/plugins/jetpack/tests/e2e',
		testArgs: [ 'specs/blocks', '--retries=1' ],
		suite: '',
	},
	{ project: 'Boost', path: 'projects/plugins/boost/tests/e2e', testArgs: [], suite: '' },
	{ project: 'Search', path: 'projects/plugins/search/tests/e2e', testArgs: [], suite: '' },
	{
		project: 'VideoPress',
		path: 'projects/plugins/videopress/tests/e2e',
		testArgs: [],
		suite: '',
	},
	{ project: 'Social', path: 'projects/plugins/social/tests/e2e', testArgs: [], suite: '' },
];

const matrix = [];

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
						matrix.push( project );
						break;
					}
				}
			} else {
				// if no targets are defined, run the tests
				matrix.push( project );
			}
		}
		break;
	}
	case 'workflow_run': {
		matrix.push( ...projects );
		break;
	}
	case 'repository_dispatch':
		if ( process.env.DISPATCH_REPO ) {
			const repoName = process.env.DISPATCH_REPO.split( '/' )[ 1 ];

			for ( const project of projects ) {
				const packageJson = JSON.parse(
					fs.readFileSync( `${ project.path }/package.json`, 'utf8' )
				);

				project.suite = repoName;
				if ( packageJson?.ci?.mirrorName === repoName ) {
					matrix.push( project );
				}
			}

			if ( repoName === 'jetpack-production' ) {
				matrix.push(
					{
						project: 'Jetpack on Atomic',
						path: 'projects/plugins/jetpack/tests/e2e',
						testArgs: [ 'blocks', '--retries=1' ],
						suite: 'atomic',
					},
					{
						project: 'Blocks with latest Gutenberg',
						path: 'projects/plugins/jetpack/tests/e2e',
						testArgs: [ 'blocks', '--retries=1' ],
						suite: 'gutenberg',
					}
				);
			}
		} else {
			// eslint-disable-next-line no-console
			console.error( 'Undefined DISPATCH_REPO!' );
		}
		break;
	default:
		// eslint-disable-next-line no-console
		console.error( `Unsupported GITHUB_EVENT_NAME ${ process.env.GITHUB_EVENT_NAME }.` );
}

// eslint-disable-next-line no-console
console.log( JSON.stringify( matrix ) );
