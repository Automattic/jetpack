const fs = require( 'fs' );
const path = require( 'path' );

module.exports = {
	branchPrefix: 'renovate/',
	allowPlugins: true,
	allowScripts: true,
	gitAuthor: 'Renovate Bot (self-hosted) <bot@renovateapp.com>',
	platform: 'github',
	repositories: [ 'Automattic/jetpack' ],

	// We're including configuration in this file.
	onboarding: false,
	requireConfig: false,

	// Extra code to run before creating a commit.
	allowPostUpgradeCommandTemplating: true,
	allowedPostUpgradeCommands: [ '/tmp/monorepo/.github/files/renovate-post-upgrade-run.sh' ],
	postUpgradeTasks: {
		commands: [ '/tmp/monorepo/.github/files/renovate-post-upgrade-run.sh {{{branchName}}}' ],
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
					const basedir = path.resolve( '/tmp/monorepo/projects/', dir );
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

		// Renovate doesn't detect this as a library, but it should be treated as one.
		{
			matchPaths: [ 'projects/packages/codesniffer/composer.json' ],
			rangeStrategy: 'replace',
		},

		// We need to keep a wide version range to support for PHP 5.6.
		{
			matchPackageNames: [ 'johnkary/phpunit-speedtrap' ],
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
			labels: [ 'Search', 'Instant Search' ],
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
		'The bot runs every half-hour, and may be monitored or triggered ahead of schedule [here](https://github.com/Automattic/jetpack/actions/workflows/renovate.yml).',
};
