import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectsRoot = fileURLToPath( new URL( '../../../../', import.meta.url ) );
const { build, skip } = JSON.parse(
	readFileSync( new URL( './build-projects.json', import.meta.url ), 'utf8' )
);
const projects = new Map();
const names = { 'composer.json': new Map(), 'package.json': new Map() };

for ( const type of [ 'plugins', 'packages', 'js-packages', 'github-actions' ] ) {
	for ( const dir of readdirSync( join( projectsRoot, type ), { withFileTypes: true } ) ) {
		if ( ! dir.isDirectory() ) {
			continue;
		}
		const slug = `${ type }/${ dir.name }`;
		const manifests = {};
		for ( const file of Object.keys( names ) ) {
			const path = join( projectsRoot, slug, file );
			manifests[ file ] = existsSync( path ) ? JSON.parse( readFileSync( path, 'utf8' ) ) : {};
			if ( manifests[ file ].name ) {
				names[ file ].set( manifests[ file ].name, slug );
			}
		}
		projects.set( slug, manifests );
	}
}

const errors = [];
for ( const slug of [ ...build, ...Object.keys( skip ) ] ) {
	if ( ! projects.has( slug ) ) {
		errors.push( `${ slug } does not exist: correct or remove it in build-projects.json.` );
	}
}
for ( const [ slug, reason ] of Object.entries( skip ) ) {
	if ( ! reason.trim() ) {
		errors.push( `${ slug }: add a reason to the skip list in build-projects.json.` );
	}
}

// Direct dependencies are Composer require or npm dependencies of Boost or Jetpack,
// mapped by manifest name to a monorepo project; dev and transitive dependencies are excluded.
for ( const owner of [ 'plugins/boost', 'plugins/jetpack' ] ) {
	for ( const [ file, key ] of [
		[ 'composer.json', 'require' ],
		[ 'package.json', 'dependencies' ],
	] ) {
		for ( const name of Object.keys( projects.get( owner )[ file ][ key ] ?? {} ) ) {
			const slug = names[ file ].get( name );
			if ( ! slug ) {
				continue;
			}
			// Build-bearing means a Composer build-production command beyond an echo placeholder.
			const commands = projects.get( slug )[ 'composer.json' ].scripts?.[ 'build-production' ];
			const hasBuild =
				commands &&
				[ commands ].flat().some( command => ! /^echo(?:\s+[^;&|]*)?$/.test( command.trim() ) );
			if ( hasBuild && ! build.includes( slug ) && ! Object.hasOwn( skip, slug ) ) {
				errors.push(
					`${ slug } (${ owner }): add it to the build list or to the skip list with a reason in build-projects.json.`
				);
			}
		}
	}
}

if ( errors.length ) {
	console.error( `Boost E2E build list needs attention:\n${ errors.join( '\n' ) }` );
	process.exit( 1 );
}
console.log( 'Boost E2E build list check passed.' );

if ( ! process.argv.includes( '--check' ) ) {
	const result = spawnSync(
		'pnpm',
		[ 'jetpack', 'build', ...build, '-v', '--no-pnpm-install', '--production' ],
		{ cwd: join( projectsRoot, '..' ), stdio: 'inherit' }
	);
	if ( result.error ) {
		console.error( result.error.message );
	}
	process.exit( result.status ?? 1 );
}
