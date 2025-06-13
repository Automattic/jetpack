// Auto-detection for projects from the monorepo root. Do not use elsewhere.

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import util from 'node:util';
import makeDebug from 'debug';
import { glob } from 'glob';
import { config } from 'typescript-eslint';
import makeReactConfig from './react.mjs';

const cwd = fileURLToPath( new URL( '../../..', import.meta.url ) );
const debug = makeDebug( 'eslintrc/auto-projects' );

const autoProjects = [];
const reactProjects = [];

/**
 * Test if a file exists.
 *
 * @param {string} file - File to test.
 * @return {boolean} Whether the file exists.
 */
async function fileExists( file ) {
	return await fs.access( file ).then(
		() => true,
		() => false
	);
}

for ( const dir of ( await glob( 'projects/*/*/composer.json', { cwd } ) )
	.map( path.dirname )
	.sort() ) {
	const eslintconfigs = await glob( 'eslint.config.?([cm])[jt]s', { cwd: path.join( cwd, dir ) } );
	if ( eslintconfigs.length > 0 ) {
		debug( `Skipping ${ dir }, has ${ eslintconfigs[ 0 ] }` );
		continue;
	}

	let any = false;
	const cfg = {
		files: [ dir + '/**' ],
		rules: {},
	};
	const composerJson = JSON.parse( await fs.readFile( path.join( cwd, dir, 'composer.json' ) ) );

	let textdomain = null;
	if ( dir.startsWith( 'projects/plugins/' ) ) {
		textdomain =
			composerJson.extra?.[ 'wp-plugin-slug' ] ?? composerJson.extra?.[ 'beta-plugin-slug' ];
	} else {
		textdomain = composerJson.extra?.textdomain;
	}
	if ( textdomain != null ) {
		any = true;
		cfg.rules[ '@wordpress/i18n-text-domain' ] = [
			'error',
			{
				allowedTextDomain: textdomain,
			},
		];
	}

	if ( await fileExists( path.join( cwd, dir, 'tsconfig.json' ) ) ) {
		any = true;
		cfg.settings = {
			'import/resolver': {
				typescript: {
					project: path.join( dir, 'tsconfig.json' ),
				},
			},
		};
	} else if ( await fileExists( path.join( cwd, dir, 'jsconfig.json' ) ) ) {
		any = true;
		cfg.settings = {
			'import/resolver': {
				typescript: {
					project: path.join( dir, 'jsconfig.json' ),
				},
			},
		};
	}

	if ( await fileExists( path.join( cwd, dir, 'package.json' ) ) ) {
		const packageJson = JSON.parse( await fs.readFile( path.join( cwd, dir, 'package.json' ) ) );
		if (
			packageJson.dependencies?.react ??
			packageJson.devDependencies?.react ??
			packageJson.optionalDependencies?.react ??
			packageJson.peerDependencies?.react
		) {
			reactProjects.push( dir + '/**' );
		}
	}

	if ( any ) {
		debug( `Config for ${ dir }: ${ util.inspect( cfg, { depth: Infinity } ) }` );
		autoProjects.push( cfg );
	} else {
		debug( `No special config for ${ dir }` );
	}
}

if ( reactProjects.length ) {
	debug(
		`React projects: ${ reactProjects.map( v => v.substring( 9, v.length - 3 ) ).join( ' ' ) }`
	);
	autoProjects.push(
		...config( {
			files: reactProjects,
			extends: [ makeReactConfig( new URL( '../../../eslint.config.mjs', import.meta.url ) ) ],
		} )
	);
}

export default autoProjects;
