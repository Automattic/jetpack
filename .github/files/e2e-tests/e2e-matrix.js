const { execSync } = require( 'child_process' );
const fs = require( 'fs' );

const projects = [
	{
		project: 'Jetpack connection',
		path: 'projects/plugins/jetpack/tests/e2e',
		testArgs: [ 'specs/connection', '--retries=1' ],
		targets: [ 'plugins/jetpack' ],
		suite: '',
		buildGroup: 'jetpack-core',
	},
	{
		project: 'Jetpack pre-connection',
		path: 'projects/plugins/jetpack/tests/e2e',
		testArgs: [ 'specs/pre-connection', '--retries=1' ],
		targets: [ 'plugins/jetpack', 'monorepo' ],
		suite: '',
		buildGroup: 'jetpack-core',
	},
	{
		project: 'Jetpack post-connection',
		path: 'projects/plugins/jetpack/tests/e2e',
		testArgs: [ 'specs/post-connection', '--retries=1' ],
		targets: [ 'plugins/jetpack' ],
		suite: '',
		buildGroup: 'jetpack-core',
	},
	{
		project: 'Jetpack sync',
		path: 'projects/plugins/jetpack/tests/e2e',
		testArgs: [ 'specs/sync', '--retries=1' ],
		targets: [ 'packages/sync' ],
		suite: '',
		buildGroup: 'jetpack-sync',
	},
	{
		project: 'Jetpack Boost - Base',
		path: 'projects/plugins/boost/tests/e2e',
		testArgs: [ 'specs/base', '--retries=1' ],
		targets: [ 'plugins/boost' ],
		suite: '',
		buildGroup: 'jetpack-boost',
	},
	{
		project: 'Jetpack Boost - Modules',
		path: 'projects/plugins/boost/tests/e2e',
		testArgs: [ 'specs/modules', '--retries=1' ],
		targets: [ 'plugins/boost' ],
		suite: '',
		buildGroup: 'jetpack-boost',
	},
	{
		project: 'Jetpack Boost - Critical CSS',
		path: 'projects/plugins/boost/tests/e2e',
		testArgs: [ 'specs/critical-css', '--retries=1' ],
		targets: [ 'plugins/boost' ],
		suite: '',
		buildGroup: 'jetpack-boost',
	},
	{
		project: 'Jetpack Boost - Page Cache',
		path: 'projects/plugins/boost/tests/e2e',
		testArgs: [ 'specs/page-cache', '--retries=1' ],
		targets: [ 'plugins/boost' ],
		suite: '',
		buildGroup: 'jetpack-boost',
	},
	{
		project: 'Jetpack Boost - Concatenate JS/CSS',
		path: 'projects/plugins/boost/tests/e2e',
		testArgs: [ 'specs/concatenate', '--retries=1' ],
		targets: [ 'plugins/boost' ],
		suite: '',
		buildGroup: 'jetpack-boost',
	},
	{
		project: 'Jetpack Boost - Image CDN',
		path: 'projects/plugins/boost/tests/e2e',
		testArgs: [ 'specs/image-cdn', '--retries=1' ],
		targets: [ 'plugins/boost' ],
		suite: '',
		buildGroup: 'jetpack-boost',
	},
	{
		project: 'Jetpack Boost - Image Guide',
		path: 'projects/plugins/boost/tests/e2e',
		testArgs: [ 'specs/image-guide', '--retries=1' ],
		targets: [ 'plugins/boost' ],
		suite: '',
		buildGroup: 'jetpack-boost',
	},
	{
		project: 'Search',
		path: 'projects/plugins/search/tests/e2e',
		testArgs: [],
		targets: [ 'plugins/search' ],
		suite: '',
		buildGroup: 'jetpack-search',
	},
	{
		project: 'VideoPress',
		path: 'projects/plugins/videopress/tests/e2e',
		testArgs: [],
		targets: [ 'plugins/videopress' ],
		suite: '',
		buildGroup: 'jetpack-videopress',
	},
	{
		project: 'Social',
		path: 'projects/plugins/social/tests/e2e',
		testArgs: [],
		targets: [ 'plugins/social' ],
		suite: '',
		buildGroup: 'jetpack-social',
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
	case 'repository_dispatch':
		if ( process.env.DISPATCH_REPO ) {
			const repoName = process.env.DISPATCH_REPO.split( '/' )[ 1 ];
			const refName = process.env.REF_NAME;
			const refType = process.env.REF_TYPE;

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
