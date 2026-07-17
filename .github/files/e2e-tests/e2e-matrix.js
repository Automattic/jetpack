const { execSync } = require( 'child_process' );
const fs = require( 'fs' );

const projects = [
	{
		project: 'Jetpack onboarding',
		path: 'projects/plugins/jetpack/tests/e2e',
		testArgs: [ 'specs/onboarding' ],
		targets: [ 'plugins/jetpack', 'monorepo' ],
		buildGroup: 'jetpack-core',
	},
	{
		project: 'Jetpack post-connection',
		path: 'projects/plugins/jetpack/tests/e2e',
		testArgs: [ 'specs/post-connection' ],
		targets: [ 'plugins/jetpack' ],
		buildGroup: 'jetpack-core',
	},
	{
		project: 'Jetpack post editor',
		path: 'projects/plugins/jetpack/tests/e2e',
		testArgs: [ 'specs/editor' ],
		targets: [ 'plugins/jetpack', 'packages/publicize' ],
		buildGroup: 'jetpack-core',
	},
	{
		project: 'Jetpack forms',
		path: 'projects/plugins/jetpack/tests/e2e',
		testArgs: [ 'specs/forms' ],
		targets: [ 'plugins/jetpack', 'packages/forms' ],
		buildGroup: 'jetpack-core',
	},
	{
		project: 'Jetpack sync',
		path: 'projects/plugins/jetpack/tests/e2e',
		testArgs: [ 'specs/sync' ],
		targets: [ 'packages/sync' ],
		buildGroup: 'jetpack-sync',
	},
	{
		project: 'Jetpack Boost - Base',
		path: 'projects/plugins/boost/tests/e2e',
		testArgs: [ 'specs/base' ],
		targets: [ 'plugins/boost' ],
		buildGroup: 'jetpack-boost',
	},
	{
		project: 'Jetpack Boost - Modules',
		path: 'projects/plugins/boost/tests/e2e',
		testArgs: [ 'specs/modules' ],
		targets: [ 'plugins/boost' ],
		buildGroup: 'jetpack-boost',
	},
	{
		project: 'Jetpack Boost - Critical CSS',
		path: 'projects/plugins/boost/tests/e2e',
		testArgs: [ 'specs/critical-css' ],
		targets: [ 'plugins/boost' ],
		buildGroup: 'jetpack-boost',
	},
	{
		project: 'Jetpack Boost - Page Cache',
		path: 'projects/plugins/boost/tests/e2e',
		testArgs: [ 'specs/page-cache' ],
		targets: [ 'plugins/boost' ],
		buildGroup: 'jetpack-boost',
	},
	{
		project: 'Jetpack Boost - Concatenate JS and CSS',
		path: 'projects/plugins/boost/tests/e2e',
		testArgs: [ 'specs/concatenate' ],
		targets: [ 'plugins/boost' ],
		buildGroup: 'jetpack-boost',
	},
	{
		project: 'Jetpack Boost - LCP Image Optimization',
		path: 'projects/plugins/boost/tests/e2e',
		testArgs: [ 'specs/lcp-optimization' ],
		targets: [ 'plugins/boost' ],
		buildGroup: 'jetpack-boost',
	},
	{
		project: 'Jetpack Boost - Cornerstone Pages',
		path: 'projects/plugins/boost/tests/e2e',
		testArgs: [ 'specs/cornerstone' ],
		targets: [ 'plugins/boost' ],
		buildGroup: 'jetpack-boost',
	},
	{
		project: 'Jetpack Boost - Image CDN',
		path: 'projects/plugins/boost/tests/e2e',
		testArgs: [ 'specs/image-cdn' ],
		targets: [ 'plugins/boost' ],
		buildGroup: 'jetpack-boost',
	},
	{
		project: 'Jetpack Boost - Image Guide',
		path: 'projects/plugins/boost/tests/e2e',
		testArgs: [ 'specs/image-guide' ],
		targets: [ 'plugins/boost' ],
		buildGroup: 'jetpack-boost',
	},
	{
		project: 'Search',
		path: 'projects/plugins/search/tests/e2e',
		testArgs: [ 'specs' ],
		targets: [ 'plugins/search' ],
		buildGroup: 'jetpack-search',
	},
	{
		project: 'VideoPress',
		path: 'projects/plugins/videopress/tests/e2e',
		testArgs: [ 'specs' ],
		targets: [ 'plugins/videopress' ],
		buildGroup: 'jetpack-videopress',
	},
	{
		project: 'Social',
		path: 'projects/plugins/social/tests/e2e',
		testArgs: [ 'specs' ],
		targets: [ 'plugins/social' ],
		buildGroup: 'jetpack-social',
	},
	{
		project: 'Protect',
		path: 'projects/plugins/protect/tests/e2e',
		testArgs: [ 'specs' ],
		targets: [ 'plugins/protect' ],
		buildGroup: 'jetpack-protect',
	},
];

/**
 * Read the minimum supported WordPress version from .github/versions.sh.
 *
 * @return {string} The version, e.g. '6.9'.
 */
function minWpVersion() {
	const versions = fs.readFileSync( '.github/versions.sh', 'utf8' );
	const match = versions.match( /^MIN_WP_VERSION=(\S+)$/m );
	if ( ! match ) {
		throw new Error( 'Could not find MIN_WP_VERSION in .github/versions.sh' );
	}
	return match[ 1 ];
}

const matrix = [];

switch ( process.env.GITHUB_EVENT_NAME ) {
	case 'pull_request':
	case 'push': {
		const changedProjects = JSON.parse(
			execSync( '.github/files/list-changed-projects.sh', {
				env: { ...process.env, EXTRA: 'e2e' },
			} ).toString()
		);

		for ( const project of projects ) {
			if ( ! project.targets ) {
				// If no targets are defined, run the tests
				matrix.push( project );
				continue;
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
	case 'schedule':
	case 'workflow_dispatch': {
		// There's no diff to narrow things down to, so run everything. WP_VERSION comes from the
		// workflow_dispatch input, and defaults to the oldest version we claim to support.
		const wpVersion = process.env.WP_VERSION || minWpVersion();

		// Reject it here, rather than let every job discover it after standing up docker. This also
		// keeps the value safe to echo into $GITHUB_OUTPUT.
		if ( ! /^(?:latest|\d+\.\d+(?:\.\d+)?)$/.test( wpVersion ) ) {
			throw new Error(
				`Invalid WordPress version '${ wpVersion }'. Expected something like '6.9' or 'latest'.`
			);
		}

		for ( const project of projects ) {
			matrix.push( { ...project, wpVersion, suite: `wp-${ wpVersion }` } );
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

				let suiteName = repoName;
				if ( refType === 'tag' ) {
					suiteName = `${ suiteName }-${ refName }`;
				} else if ( refType === 'branch' && refName !== 'trunk' ) {
					suiteName = `${ suiteName }-rc`;
				}

				project.suite = suiteName;

				if ( packageJson?.ci?.mirrorName === repoName ) {
					matrix.push( project );
				}
			}
		} else {
			console.error( 'Undefined DISPATCH_REPO!' );
		}
		break;
	default:
		console.error( `Unsupported GITHUB_EVENT_NAME ${ process.env.GITHUB_EVENT_NAME }.` );
}

console.log( JSON.stringify( matrix ) );
