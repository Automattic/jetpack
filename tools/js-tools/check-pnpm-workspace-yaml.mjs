#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { styleText } from 'node:util';
import * as YAML from 'yaml';

const isCI = !! process.env.CI;

const debug = msg => {
	console.log( styleText( 'grey', msg ) );
};
const error = ( file, line, msg ) => {
	process.exitCode = 1;
	if ( isCI ) {
		console.log( `::error file=${ file },line=${ line }::${ msg.replace( /\n/g, '%0A' ) }` );
	} else {
		console.error(
			styleText( [ 'white', 'bgRed' ], `${ file }:${ line }: ${ msg }`, { stream: process.stderr } )
		);
	}
};

/**
 * Get the line number of a node.
 *
 * @param {YAML.Node} node         - Node being checked.
 * @param {string}    fileContents - Contents of the file.
 * @return {number} Line number.
 */
function yamlLine( node, fileContents ) {
	return fileContents.slice( 0, node.range[ 0 ] ).split( /\n/ ).length;
}

const packages = YAML.parse(
	fs.readFileSync( new URL( '../../pnpm-lock.yaml', import.meta.url ), 'utf8' )
).packages;

const file = path.join( import.meta.dirname, '../../pnpm-workspace.yaml' );
const fileContents = fs.readFileSync( file, 'utf8' );
const pnpmWorkspace = YAML.parseDocument( fileContents );
if ( pnpmWorkspace.errors.length ) {
	for ( const e of pnpmWorkspace.errors ) {
		const line = fileContents.substring( 0, e.source.range.start ).split( /\n/ ).length;
		error( file, line, `${ e.name }: ${ e.message }` );
	}
	process.exit( 1 );
}
if ( ! ( pnpmWorkspace.contents instanceof YAML.YAMLMap ) ) {
	error( file, yamlLine( pnpmWorkspace.contents, fileContents ), `File is not a YAML map` );
	process.exit( 1 );
}

checkTrustPolicyExclude();
checkDependencyHacks();
checkUnwantedSettings();

/**
 * Check for obsolete trustPolicyExclude entries.
 */
function checkTrustPolicyExclude() {
	const trustPolicyExclude = pnpmWorkspace.contents.get( 'trustPolicyExclude' );
	if ( ! trustPolicyExclude ) {
		debug( `No trustPolicyExclude found. That's good!` );
		return;
	}
	if ( ! ( trustPolicyExclude instanceof YAML.YAMLSeq ) ) {
		error(
			file,
			yamlLine( trustPolicyExclude, fileContents ),
			`trustPolicyExclude is not a YAML sequence`
		);
		process.exitCode = 1;
		return;
	}

	for ( const item of trustPolicyExclude.items ) {
		if ( ! ( item instanceof YAML.Scalar ) ) {
			error(
				file,
				yamlLine( item, fileContents ),
				`Item in trustPolicyExclude is supposed to be a scalar`
			);
			process.exitCode = 1;
			continue;
		}

		const pkg = item.toJSON();
		const pkgs = [];
		if ( pkg.match( /@\d+(?:\.\d+)*$/ ) ) {
			pkgs.push( pkg );
		} else if ( pkg.match( /@\d+(?:\.\d+)*(?:\s*\|\|\s*\d+(?:\.\d+)*)+$/ ) ) {
			const idx = pkg.lastIndexOf( '@' );
			for ( const v of pkg.substring( idx + 1 ).split( /\s*\|\|\s*/ ) ) {
				pkgs.push( pkg.substring( 0, idx + 1 ) + v );
			}
		} else {
			error(
				file,
				yamlLine( item, fileContents ),
				`Unrecognized trustPolicyExclude item format ${ pkg }. This may be valid for pnpm, but the audit script doesn't recognize it. It'd probably be safer to list only the exact versions needed (with \`||\`) anyway.`
			);
			process.exitCode = 1;
			continue;
		}

		for ( const p of pkgs ) {
			if ( ! packages[ p ] ) {
				error(
					file,
					yamlLine( item, fileContents ),
					`Package ${ p } does not seem to be installed. Remove it from trustPolicyExclude.`
				);
				process.exitCode = 1;
			}
		}
	}
}

/**
 * Check for dependency hacks that should be in .pnpmfile.cjs.
 */
function checkDependencyHacks() {
	const keys = [ 'overrides', 'packageExtensions', 'peerDependencyRules' ];
	for ( const key of keys ) {
		const kpath = key.split( '.' );
		if ( pnpmWorkspace.contents.hasIn( kpath ) ) {
			error(
				file,
				yamlLine( pnpmWorkspace.contents.getIn( kpath, true ), fileContents ),
				`We do dependency overrides in \`.pnpmfile.cjs\` rather than in \`pnpm-workspace.yaml\`.\n\nPartly for historical reasons, but also because that file is more flexible and it's useful to keep all dependency overrides together. When moving this there, please also include a reference to an upstream issue to facilitate auditing for removal.`
			);
			process.exitCode = 1;
		}
	}
}

/**
 * Check for addition of things we don't want set.
 */
function checkUnwantedSettings() {
	const settings = {
		allowedDeprecatedVersions: `We prefer to see deprecation warnings so we know to clean them up.`,
		// See https://github.com/Automattic/jetpack/pull/48093 and https://github.com/Automattic/jetpack/pull/50401.
		virtualStoreType: `This has side effects for others' workflows. If you want to use it for your local machine, you can do \`pnpm config --global set enableGlobalVirtualStore true\`.`,
	};
	settings.enableGlobalVirtualStore = settings.virtualStoreType;

	for ( const [ key, msg ] of Object.entries( settings ) ) {
		const kpath = key.split( '.' );
		if ( pnpmWorkspace.contents.hasIn( kpath ) ) {
			error(
				file,
				yamlLine( pnpmWorkspace.contents.getIn( kpath, true ), fileContents ),
				`Please don't set \`${ key }\` in \`pnpm-workspace.yaml\`. ${ msg }`
			);
			process.exitCode = 1;
		}
	}
}
