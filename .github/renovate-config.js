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
	allowPostUpgradeCommandTemplating: true,
	allowedPostUpgradeCommands: [ monorepoBase + '.github/files/renovate-post-upgrade-run.sh' ],
	postUpgradeTasks: {
		commands: [ monorepoBase + '.github/files/renovate-post-upgrade-run.sh {{{branchName}}}' ],
		// Anything might change thanks to version bumping.
		fileFilters: [ '**' ],
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
	],
};
