const child_process = require( 'child_process' );
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
	ignoreScripts: false,
	gitAuthor: 'Renovate Bot (self-hosted) <bot@renovateapp.com>',
	platform: 'github',
	repositories: [ 'Automattic/jetpack' ],

	// Extra code to run before creating a commit.
	allowedPostUpgradeCommands: [ monorepoBase + '.github/files/renovate-post-upgrade-run.sh' ],
	postUpgradeTasks: {
		commands: [ monorepoBase + '.github/files/renovate-post-upgrade-run.sh {{{branchName}}}' ],
		executionMode: 'branch',
	},
	postUpdateOptions: [ 'pnpmDedupe' ],

	// Most of the actual renovate configuration is in renovate.json5, except for a few things
	// where we want to read part of it from somewhere else.
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
		// PHP non-dev deps need to work with the oldest PHP versions we support.
		{
			matchDatasources: [ 'packagist' ],
			matchDepTypes: [ 'require' ],
			constraintsFiltering: 'strict',
			constraints: {
				php: `~${ versions.MIN_PHP_VERSION }.0`,
			},
			// Need to have renovate tell composer to ignore `.require.php` since dev deps aren't constrained by this
			// but renovate insists on using the above to choose the PHP version to run with. Sigh.
			composerIgnorePlatformReqs: [ 'ext-*', 'lib-*', 'php' ],
		},
		...( () => {
			const ret = {};
			const { stdout } = child_process.spawnSync(
				'git',
				[ '-c', 'core.quotepath=off', 'ls-files', 'composer.json', '*/composer.json' ],
				{
					cwd: monorepoBase,
					stdio: [ 'ignore', 'pipe', 'ignore' ],
					encoding: 'utf-8',
				}
			);
			for ( const filepath of stdout.split( /\n/ ) ) {
				if ( filepath === '' ) {
					continue;
				}
				const json = JSON.parse(
					fs.readFileSync( path.resolve( monorepoBase, filepath ), 'utf8' )
				);
				if ( json.require?.php && json.require.php !== `>=${ versions.MIN_PHP_VERSION }` ) {
					let req = json.require.php;

					// Renovate is very cautious, ">=7.4" won't match "^7.0 || ^8.0" because 9.0 could exist.
					// Rewrite it to "~7.4.0", since if it supports 7.4 it's probably ok with 8.0 (minus perhaps some deprecation warnings).
					const m = json.require.php.match( /^>=(\d+\.\d+)$/ );
					if ( m ) {
						req = `~${ m[ 1 ] }.0`;
					}

					if ( ! ret[ req ] ) {
						ret[ req ] = {
							matchFileNames: [],
							matchDatasources: [ 'packagist' ],
							matchDepTypes: [ 'require' ],
							constraints: {
								php: req,
							},
						};
					}
					ret[ req ].matchFileNames.push( filepath );
				}
			}
			return Object.values( ret );
		} )(),
	],
};
