import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectsRoot = fileURLToPath( new URL( '../../../../', import.meta.url ) );
const { build, skip } = readJson( new URL( './build-projects.json', import.meta.url ) );
const projects = new Map();
const names = { 'composer.json': new Map(), 'package.json': new Map() };

/**
 * Include the filename when JSON cannot be parsed.
 *
 * @param {string|URL} path - JSON file path.
 * @return {object} Parsed manifest or build list.
 */
function readJson( path ) {
	const content = readFileSync( path, 'utf8' );
	let parsed;
	try {
		parsed = JSON.parse( content );
	} catch ( error ) {
		console.error(
			`Invalid JSON in ${ path instanceof URL ? fileURLToPath( path ) : path }: ${ error.message }`
		);
		process.exit( 1 );
	}
	return parsed;
}

for ( const type of [ 'plugins', 'packages', 'js-packages', 'github-actions' ] ) {
	for ( const dir of readdirSync( join( projectsRoot, type ), { withFileTypes: true } ) ) {
		if ( ! dir.isDirectory() ) {
			continue;
		}
		const slug = `${ type }/${ dir.name }`;
		if ( ! existsSync( join( projectsRoot, slug, 'composer.json' ) ) ) {
			continue;
		}
		const manifests = {};
		for ( const file of Object.keys( names ) ) {
			const path = join( projectsRoot, slug, file );
			manifests[ file ] = existsSync( path ) ? readJson( path ) : {};
			if ( manifests[ file ].name ) {
				names[ file ].set( manifests[ file ].name, slug );
			}
		}
		projects.set( slug, manifests );
	}
}

const directDependencies = new Map();
// Direct dependencies are Composer require, npm dependencies or npm devDependencies of Boost or Jetpack,
// mapped by manifest name to a monorepo project; transitive dependencies are excluded.
for ( const owner of [ 'plugins/boost', 'plugins/jetpack' ] ) {
	for ( const [ file, key ] of [
		[ 'composer.json', 'require' ],
		[ 'package.json', 'dependencies' ],
		[ 'package.json', 'devDependencies' ],
	] ) {
		for ( const name of Object.keys( projects.get( owner )[ file ][ key ] ?? {} ) ) {
			const slug = names[ file ].get( name );
			if ( ! slug ) {
				continue;
			}
			if ( ! directDependencies.has( slug ) ) {
				directDependencies.set( slug, new Set() );
			}
			directDependencies.get( slug ).add( owner );
		}
	}
}

const errors = [];
const warnings = [];
const targets = new Set( build );
for ( const slug of targets ) {
	if ( ! projects.has( slug ) ) {
		errors.push( `${ slug } does not exist: correct or remove it in build-projects.json.` );
	}
	if ( build.indexOf( slug ) !== build.lastIndexOf( slug ) ) {
		errors.push( `${ slug }: remove the duplicate from the build list in build-projects.json.` );
	}
	if ( Object.hasOwn( skip, slug ) ) {
		errors.push( `${ slug }: keep it in either build or skip, not both, in build-projects.json.` );
	}
}
for ( const [ slug, reason ] of Object.entries( skip ) ) {
	if ( ! projects.has( slug ) || ! directDependencies.has( slug ) ) {
		const issue = projects.has( slug )
			? 'is no longer a direct dependency of Boost or Jetpack'
			: 'does not exist';
		warnings.push( `${ slug } ${ issue }: remove or update its skip in build-projects.json.` );
	}
	if ( ! reason.trim() ) {
		errors.push( `${ slug }: add a reason to the skip list in build-projects.json.` );
	}
}
for ( const [ slug, owners ] of directDependencies ) {
	// Build-bearing means a production build script, or the development one the CLI falls back to,
	// that is more than an echo placeholder.
	const scripts = projects.get( slug )[ 'composer.json' ].scripts;
	const commands = scripts?.[ 'build-production' ] || scripts?.[ 'build-development' ];
	const hasBuild =
		commands &&
		[ commands ].flat().some( command => ! /^echo(?:\s+[^;&|]*)?$/.test( command.trim() ) );
	if ( ! hasBuild || targets.has( slug ) || Object.hasOwn( skip, slug ) ) {
		continue;
	}
	const message = `${ slug } (${ [ ...owners ].join( ', ' ) })`;
	const action =
		'add it to the build list or to the skip list with a reason in build-projects.json.';
	if ( owners.has( 'plugins/boost' ) ) {
		errors.push( `${ message }: ${ action }` );
	} else {
		targets.add( slug );
		warnings.push( `Building unlisted ${ message } for this run: ${ action }` );
	}
}

for ( const warning of warnings ) {
	console.warn( `::warning::${ warning }` );
}
if ( errors.length ) {
	console.error( `Boost E2E build list needs attention:\n${ errors.join( '\n' ) }` );
	process.exit( 1 );
}
console.log( 'Boost E2E build list check passed.' );

const args = [ 'jetpack', 'build', ...targets, '-v', '--no-pnpm-install', '--production' ];
// --check validates the lists and prints the build arguments without building.
if ( process.argv.includes( '--check' ) ) {
	console.log( `Boost E2E build arguments: ${ JSON.stringify( args ) }` );
} else {
	const result = spawnSync( 'pnpm', args, { cwd: join( projectsRoot, '..' ), stdio: 'inherit' } );
	if ( result.error ) {
		console.error( result.error.message );
	}
	process.exit( result.status ?? 1 );
}
