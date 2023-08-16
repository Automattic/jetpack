const { execSync } = require( 'child_process' );
const fs = require( 'fs' );

const projects = [
	{
		project: 'Jetpack connection',
		path: 'projects/plugins/jetpack/tests/e2e',
		testArgs: [ 'specs/connection', '--retries=1' ],
		targets: [ 'plugins/jetpack' ],
		suite: '',
	},
	{
		project: 'Jetpack pre-connection',
		path: 'projects/plugins/jetpack/tests/e2e',
		testArgs: [ 'specs/pre-connection', '--retries=1' ],
		targets: [ 'plugins/jetpack', 'monorepo' ],
		suite: '',
	},
	{
		project: 'Jetpack post-connection',
		path: 'projects/plugins/jetpack/tests/e2e',
		testArgs: [ 'specs/post-connection', '--retries=1' ],
		targets: [ 'plugins/jetpack' ],
		suite: '',
	},
	{
		project: 'Jetpack sync',
		path: 'projects/plugins/jetpack/tests/e2e',
		testArgs: [ 'specs/sync', '--retries=1' ],
		targets: [ 'packages/sync' ],
		suite: '',
	},
	{
		project: 'Jetpack blocks',
		path: 'projects/plugins/jetpack/tests/e2e',
		testArgs: [ 'specs/blocks', '--retries=1' ],
		targets: [ 'plugins/jetpack' ],
		suite: '',
	},
	{
		project: 'Boost',
		path: 'projects/plugins/boost/tests/e2e',
		testArgs: [],
		targets: [ 'plugins/boost' ],
		suite: '',
	},
	{
		project: 'Search',
		path: 'projects/plugins/search/tests/e2e',
		testArgs: [],
		targets: [ 'plugins/search' ],
		suite: '',
	},
	{
		project: 'VideoPress',
		path: 'projects/plugins/videopress/tests/e2e',
		testArgs: [],
		targets: [ 'plugins/videopress' ],
		suite: '',
	},
	{
		project: 'Social',
		path: 'projects/plugins/social/tests/e2e',
		testArgs: [],
		targets: [ 'plugins/social' ],
		suite: '',
	},
];

const matrix = [];

switch ( process.env.GITHUB_EVENT_NAME ) {
	case 'pull_request':
	case 'push': {
		const changedProjects = JSON.parse(
			execSync( '.github/files/list-changed-projects.sh' ).toString()
		);

		for ( const project of projects ) {
			if ( ! project.targets ) {
				// If no targets are defined, run the tests
				matrix.push( project );
			}

			const targets = execSync(
				`pnpm jetpack dependencies list --add-dependencies ${ project.targets.join( ' ' ) }`
			)
				.toString()
				.split( '\n' );

			if ( Object.keys( changedProjects ).some( target => targets.includes( target ) ) ) {
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
			const refName = process.env.REF_NAME;
			const refType = process.env.REF_TYPE;

			if ( repoName === 'jetpack-production' ) {
				projects.push( {
					project: 'Blocks with latest Gutenberg',
					path: 'projects/plugins/jetpack/tests/e2e',
					testArgs: [ 'blocks', '--retries=1' ],
					suite: 'gutenberg',
				} );

				if ( refType === 'tag' || refName === 'trunk' ) {
					projects.push( {
						project: 'Jetpack on Atomic',
						path: 'projects/plugins/jetpack/tests/e2e',
						testArgs: [ 'blocks', '--retries=1' ],
						suite: 'atomic',
					} );
				}

				if ( refName === 'trunk' ) {
					projects.push( {
						project: 'Jetpack on VIP',
						path: 'projects/plugins/jetpack/tests/e2e',
						testArgs: [ 'blocks', '--retries=1' ],
						suite: 'vip',
					} );
				}
			}

			for ( const project of projects ) {
				const packageJson = JSON.parse(
					fs.readFileSync( `${ project.path }/package.json`, 'utf8' )
				);

				let suiteName = project.suite ? project.suite : repoName;
				if ( refType === 'tag' ) {
					suiteName = `${ suiteName }-${ refName }`;
				}

				if ( refType === 'branch' && refName !== 'trunk' ) {
					suiteName = `${ suiteName }-rc`;
				}

				project.suite = suiteName;

				if ( packageJson?.ci?.mirrorName === repoName ) {
					matrix.push( project );
				}
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
