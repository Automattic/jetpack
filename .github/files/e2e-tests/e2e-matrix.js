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
		project: 'Jetpack comments',
		path: 'projects/plugins/jetpack/tests/e2e',
		testArgs: [ 'specs/comments' ],
		targets: [ 'plugins/jetpack', 'packages/comments' ],
		buildGroup: 'jetpack-core',
	},
	{
		project: 'Jetpack admin shell',
		path: 'projects/plugins/jetpack/tests/e2e',
		testScript: 'test:admin-shell:ci',
		testArgs: [],
		targets: [ 'plugins/jetpack' ],
		buildGroup: 'jetpack-core',
		// On pull requests: WordPress latest only, and only the @smoke tests unless the PR itself changes one of these projects or files.
		pullRequest: {
			wpVersions: [ 'latest' ],
			fullSuiteFor: [
				'packages/admin-ui',
				'packages/my-jetpack',
				'packages/jitm',
				'packages/forms',
				'packages/podcast',
				'packages/protect',
				'packages/search',
				'packages/backup',
				'packages/activity-log',
				'packages/publicize',
				'packages/newsletter',
				'packages/seo',
				'packages/videopress',
			],
			// The Settings and AI dashboards and the shell wiring in the Jetpack plugin, the suite itself, and its CI files (when the PR also reaches the plugin).
			fullSuiteForFiles: new RegExp(
				[
					'^projects/plugins/jetpack/(_inc/lib/admin-pages/|routes/(settings|ai-hub)/|load-jetpack\\.php|class\\.jetpack-admin\\.php)',
					'^projects/plugins/jetpack/tests/e2e/(specs/admin-shell/|helpers/admin-shell|plugins/e2e-admin-shell|bin/admin-shell|playwright\\.admin-shell)',
					'^\\.github/(workflows/e2e-tests\\.yml|files/e2e-tests/)',
				].join( '|' )
			),
		},
	},
	{
		project: 'Jetpack sync',
		path: 'projects/plugins/jetpack/tests/e2e',
		testArgs: [ 'specs/sync' ],
		targets: [ 'packages/sync' ],
		buildGroup: 'jetpack-core',
	},
	{
		project: 'Jetpack Boost - Base',
		path: 'projects/plugins/boost/tests/e2e',
		testArgs: [ 'specs/base' ],
		targets: [ 'plugins/boost' ],
		buildGroup: 'jetpack-boost',
	},
	{
		project: 'Jetpack Boost - Dashboard Modernization',
		path: 'projects/plugins/boost/tests/e2e',
		testArgs: [ 'specs/modernization' ],
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
	{
		project: 'Backup',
		path: 'projects/plugins/backup/tests/e2e',
		testArgs: [ 'specs' ],
		targets: [ 'plugins/backup' ],
		buildGroup: 'jetpack-backup',
	},
	{
		project: 'Premium Analytics',
		path: 'projects/plugins/premium-analytics/tests/e2e',
		testArgs: [ 'specs' ],
		targets: [ 'plugins/premium-analytics', 'packages/ads' ],
		buildGroup: 'jetpack-premium-analytics',
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

/**
 * The pull request's diff range, for `git diff`.
 *
 * @return {string} `base...head`.
 */
function pullRequestDiff() {
	const event = JSON.parse( fs.readFileSync( process.env.GITHUB_EVENT_PATH, 'utf8' ) );
	return `${ event.pull_request.base.sha }...${ event.pull_request.head.sha }`;
}

/**
 * Files the pull request changes.
 *
 * @return {string[]} Paths from the repository root.
 */
function changedFiles() {
	return execSync( `git diff --name-only ${ pullRequestDiff() }` )
		.toString()
		.split( '\n' )
		.filter( Boolean );
}

/**
 * Projects the pull request changes itself, without the projects that only depend on them.
 *
 * @return {Set<string>} Project slugs, e.g. 'packages/admin-ui'.
 */
function directlyChangedProjects() {
	const diff = pullRequestDiff();
	return new Set(
		// `--extra=e2e`: a change to the e2e environment counts as a change to every project.
		execSync( `pnpm jetpack dependencies list --extra=e2e --git-changed=${ diff }` )
			.toString()
			.split( '\n' )
			.filter( Boolean )
	);
}

/**
 * Queue a project against both the latest WordPress release and the oldest one we still support,
 * so a change that only breaks the minimum version is caught while it's still in review.
 *
 * @param {object} project - The project entry to expand.
 */
function pushBothVersions( project ) {
	for ( const wpVersion of [ 'latest', minWpVersion() ] ) {
		matrix.push( { ...project, wpVersion } );
	}
}

switch ( process.env.GITHUB_EVENT_NAME ) {
	case 'pull_request':
	case 'push': {
		const changedProjects = JSON.parse(
			execSync( '.github/files/list-changed-projects.sh', {
				env: { ...process.env, EXTRA: 'e2e' },
			} ).toString()
		);

		const dependencyCache = new Map();

		for ( const project of projects ) {
			if ( ! project.targets ) {
				// If no targets are defined, run the tests
				pushBothVersions( project );
				continue;
			}

			const command = `pnpm jetpack dependencies list --add-dependencies ${ project.targets.join( ' ' ) }`;
			if ( ! dependencyCache.has( command ) ) {
				dependencyCache.set( command, execSync( command ).toString().split( '\n' ) );
			}
			const targets = dependencyCache.get( command );

			if ( ! Object.keys( changedProjects ).some( target => targets.includes( target ) ) ) {
				continue;
			}
			if ( ! project.pullRequest || process.env.GITHUB_EVENT_NAME !== 'pull_request' ) {
				pushBothVersions( project );
				continue;
			}
			const { fullSuiteFor, fullSuiteForFiles } = project.pullRequest;
			const direct = directlyChangedProjects();
			const smoke =
				! fullSuiteFor.some( slug => direct.has( slug ) ) &&
				! changedFiles().some( file => fullSuiteForFiles.test( file ) );
			for ( const wpVersion of project.pullRequest.wpVersions ) {
				matrix.push( { ...project, wpVersion, smoke } );
			}
		}
		break;
	}
	case 'workflow_dispatch': {
		// There's no diff to narrow things down to, so run everything against the single version
		// asked for, defaulting to the oldest one we claim to support. Unlike the other events this
		// doesn't also run 'latest': the point of a manual dispatch is to target one version.
		const wpVersion = process.env.WP_VERSION || minWpVersion();

		// Reject it here, rather than let every job discover it after standing up docker. This also
		// keeps the value safe to echo into $GITHUB_OUTPUT. Pre-releases are allowed so we can test
		// ahead of a stable release: '7.1-beta2' and '7.1-RC1', plus the revision-suffixed builds the
		// .org development channel serves, e.g. '7.1-beta2-62798'.
		if (
			! /^(?:latest|nightly|\d+\.\d+(?:\.\d+)?(?:-[A-Za-z]+\d*(?:-\d+)?)?)$/.test( wpVersion )
		) {
			throw new Error(
				`Invalid WordPress version '${ wpVersion }'. Expected something like '6.9', '7.1-RC1', 'latest' or 'nightly'.`
			);
		}

		for ( const project of projects ) {
			matrix.push( { ...project, wpVersion } );
		}
		break;
	}
	case 'repository_dispatch':
		if ( process.env.DISPATCH_REPO ) {
			const repoName = process.env.DISPATCH_REPO.split( '/' )[ 1 ];

			for ( const project of projects ) {
				const packageJson = JSON.parse(
					fs.readFileSync( `${ project.path }/package.json`, 'utf8' )
				);

				if ( packageJson?.ci?.mirrorName === repoName ) {
					pushBothVersions( project );
				}
			}
		} else {
			console.error( 'Undefined DISPATCH_REPO!' );
		}
		break;
	default:
		console.error( `Unsupported GITHUB_EVENT_NAME ${ process.env.GITHUB_EVENT_NAME }.` );
}

// `pullRequest` is input for this script, not for the workflow.
console.log( JSON.stringify( matrix.map( ( { pullRequest, ...entry } ) => entry ) ) );
