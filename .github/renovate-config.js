const fs = require( 'fs' );
const path = require( 'path' );

const monorepoBase = '/tmp/monorepo/';

const composerLibraryFiles = [];
{
	const libtypes = new Set( [ 'jetpack-library', 'phpcodesniffer-standard' ] );
	const basedir = monorepoBase + 'projects/packages';
	for ( const d of fs.readdirSync( basedir, { withFileTypes: true } ) ) {
		const filepath = path.join( basedir, d.name, 'composer.json' );
		if ( ! fs.existsSync( filepath ) ) {
			continue;
		}
		const json = JSON.parse( fs.readFileSync( filepath, 'utf8' ) );
		if ( libtypes.has( json.type ) ) {
			composerLibraryFiles.push( filepath.substring( monorepoBase.length ) );
		}
	}
	composerLibraryFiles.sort();
}

const versions = Object.fromEntries(
	Array.from(
		fs
			.readFileSync( monorepoBase + '.github/versions.sh', 'utf8' )
			.matchAll( /^\s*([a-zA-Z_][a-zA-Z0-9_]*)=(.*?)\s*$/gm ),
		v => [ v[ 1 ], v[ 2 ] ]
	)
);

module.exports = {
	branchPrefix: 'renovate/',
	allowPlugins: true,
	allowScripts: true,
	gitAuthor: 'Renovate Bot (self-hosted) <bot@renovateapp.com>',
	platform: 'github',
	repositories: [ 'Automattic/jetpack' ],

	// We're including configuration in this file.
	onboarding: false,
	requireConfig: 'optional',

	// Extra code to run before creating a commit.
	allowPostUpgradeCommandTemplating: true,
	allowedPostUpgradeCommands: [ monorepoBase + '.github/files/renovate-post-upgrade-run.sh' ],
	postUpgradeTasks: {
		commands: [ monorepoBase + '.github/files/renovate-post-upgrade-run.sh {{{branchName}}}' ],
		// Anything might change thanks to version bumping.
		fileFilters: [ '**' ],
		executionMode: 'branch',
	},

	// This is the renovate configuration.
	extends: [ 'config:base' ],
	labels: [ '[Type] Janitorial', '[Status] Needs Review' ],
	prHourlyLimit: 1,
	timezone: 'UTC',
	schedule: [ 'before 3am on the first day of the month' ],
	updateNotScheduled: false,
	semanticCommits: 'disabled',
	constraints: {
		php: `~${ versions.PHP_VERSION }.0`,
	},
	packageRules: [
		// Monorepo packages shouldn't be processed by renovate.
		{
			groupName: 'Monorepo packages',
			matchPackageNames: ( () => {
				const monorepoPackages = [];
				const files = {
					packages: 'composer.json',
					'js-packages': 'package.json',
				};
				for ( const [ dir, file ] of Object.entries( files ) ) {
					const basedir = path.resolve( monorepoBase, 'projects/', dir );
					for ( const d of fs.readdirSync( basedir, { withFileTypes: true } ) ) {
						if ( ! d.isDirectory() ) {
							continue;
						}
						const filepath = path.join( basedir, d.name, file );
						if ( ! fs.existsSync( filepath ) ) {
							continue;
						}
						const json = JSON.parse( fs.readFileSync( filepath, 'utf8' ) );
						if ( json.name ) {
							monorepoPackages.push( json.name );
						}
					}
				}
				return monorepoPackages.sort();
			} )(),
			enabled: false,
		},

		// Renovate doesn't detect some of our PHP packages as libraries, so we need to override `rangeStrategy`.
		{
			matchPaths: composerLibraryFiles,
			matchDepTypes: [ 'require' ],
			rangeStrategy: 'replace',
		},
		{
			matchPaths: composerLibraryFiles,
			matchDepTypes: [ 'require' ],
			matchCurrentVersion: '/ \\|\\| /',
			rangeStrategy: 'widen',
		},

		// We need to keep a wide version range to support PHP 5.6.
		// Note for libraries used in plugins this will only work right for require-dev deps, not require.
		{
			matchPackageNames: [
				'johnkary/phpunit-speedtrap',
				'symfony/console',
				'symfony/process',
				'wikimedia/at-ease',
				'wikimedia/testing-access-wrapper',
			],
			rangeStrategy: 'widen',
		},

		// Various other monorepos and package groupings.
		{
			extends: [ 'monorepo:wordpress' ],
			separateMajorMinor: false,
			prPriority: 1,
		},
		{
			extends: [ 'monorepo:react' ],
		},
		{
			extends: [ 'packages:eslint' ],
			groupName: 'Eslint packages',
		},
		{
			extends: [ 'packages:jsUnitTest' ],
			groupName: 'JS unit testing packages',
		},
		{
			groupName: 'Size-limit',
			matchPackageNames: [ 'size-limit', '@size-limit/preset-app' ],
		},
		// These aren't a monorepo, but we may as well do them all together anyway.
		{
			groupName: 'GitHub API packages',
			matchPackagePatterns: [ '^@actions/', '^@octokit/' ],
		},

		// 🤷
		{
			groupName: 'Instant Search Dependency Updates',
			matchPackageNames: [
				'cache',
				'preact',
				'progress-event',
				'q-flat',
				'qss',
				'strip',
				'uuid',
				'@testing-library/preact',
			],
			reviewers: [ 'team:jetpack-search' ],
			addLabels: [ 'Search', 'Instant Search' ],
		},
	],
	lockFileMaintenance: {
		enabled: true,
		schedule: [ 'before 3:00 am on Monday on the 7th through 13th day of the month' ],
	},
	dependencyDashboard: true,
	dependencyDashboardTitle: 'Renovate Dependency Updates',
	dependencyDashboardLabels: [ 'Primary Issue', '[Type] Janitorial' ],
	dependencyDashboardFooter:
		'The bot runs every two hours, and may be monitored or triggered ahead of schedule [here](https://github.com/Automattic/jetpack/actions/workflows/renovate.yml).',
};
