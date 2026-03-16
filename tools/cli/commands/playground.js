import child_process from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import { projectDir } from '../helpers/install.js';
import { maybePromptForPlugin } from './rsync.js';

const cliPath = fileURLToPath( new URL( '../bin/jetpack.js', import.meta.url ) );

export const command = 'playground [plugin]';
export const describe = 'Starts a WordPress Playground instance with a plugin mounted';

/**
 * Options definition for the playground subcommand.
 *
 * @param {object} yargs - The Yargs dependency.
 * @return {object} Yargs with the playground commands defined.
 */
export function builder( yargs ) {
	return yargs
		.positional( 'plugin', {
			describe: 'Plugin name, e.g. jetpack',
			type: 'string',
		} )
		.option( 'blueprint', {
			alias: 'b',
			type: 'string',
			description: 'Path to a custom blueprint.json file',
		} )
		.option( 'port', {
			alias: 'p',
			type: 'number',
			description: 'Port to run the Playground server on',
		} )
		.example( 'jetpack playground jetpack', 'Start Playground with the Jetpack plugin' )
		.example( 'jetpack playground crm', 'Start Playground with the CRM plugin' );
}

/**
 * Entry point for the playground CLI.
 *
 * @param {object} argv - The argv for the command line.
 */
export async function handler( argv ) {
	argv = await maybePromptForPlugin( argv );

	// Validate port if provided.
	if ( argv.port !== undefined ) {
		if ( ! Number.isInteger( argv.port ) || argv.port < 1 || argv.port > 65535 ) {
			console.error( chalk.red( 'Port must be an integer between 1 and 65535.' ) );
			process.exit( 1 );
		}
	}

	// Warn if @wp-playground/cli needs to be downloaded (first run).
	const playgroundCheck = child_process.spawnSync(
		'npx',
		[ '--no-install', '@wp-playground/cli', '--version' ],
		{ stdio: 'ignore' }
	);
	if ( playgroundCheck.status !== 0 ) {
		console.log(
			chalk.yellow(
				'@wp-playground/cli is not yet cached. The first run will download it, which may take a moment.'
			)
		);
	}

	const pluginPath = projectDir( `plugins/${ argv.plugin }` );

	// Read the plugin slug from composer.json so the mount path inside
	// Playground uses the correct wp-plugin-slug (e.g. zero-bs-crm for crm).
	const composerJsonPath = path.join( pluginPath, 'composer.json' );
	let wpPluginSlug = argv.plugin;
	if ( fs.existsSync( composerJsonPath ) ) {
		try {
			const composerJson = JSON.parse( fs.readFileSync( composerJsonPath, 'utf8' ) );
			wpPluginSlug =
				composerJson?.extra?.[ 'wp-plugin-slug' ] ??
				composerJson?.extra?.[ 'beta-plugin-slug' ] ??
				argv.plugin;
		} catch {
			// Fall back to directory name if composer.json is unreadable.
		}
	}

	// If the plugin hasn't been built, run the build first.
	if (
		! fs.existsSync( path.join( pluginPath, 'vendor' ) ) ||
		! fs.existsSync( path.join( pluginPath, 'node_modules' ) )
	) {
		console.log(
			chalk.yellow( `Plugin "${ argv.plugin }" does not appear to be built. Building...` )
		);
		const build = child_process.spawnSync(
			process.execPath,
			[ cliPath, 'build', `plugins/${ argv.plugin }` ],
			{ stdio: 'inherit' }
		);
		if ( build.status !== 0 ) {
			console.error(
				chalk.red( 'Build failed. Please run "jetpack build" manually and try again.' )
			);
			process.exit( 1 );
		}
	}

	// Build the blueprint into a temp directory.
	const tmpDir = fs.mkdtempSync( path.join( os.tmpdir(), `jetpack-playground-${ argv.plugin }-` ) );

	// The vendor/jetpack_vendor directories contain symlinks like
	// ../../../../packages/<name>/ which, from the plugin location at
	// /wordpress/wp-content/plugins/<slug>/jetpack_vendor/automattic/<pkg>,
	// resolve to /wordpress/wp-content/packages/<name>/. We mount
	// projects/packages there so these symlinks resolve to real files and
	// plugins_url() can generate correct URLs (paths stay under wp-content).
	const packagesPath = projectDir( 'packages' );

	try {
		const blueprintPath = buildBlueprint( pluginPath, tmpDir, argv, wpPluginSlug );

		const port = argv.port ?? 9400;

		const args = [
			'@wp-playground/cli',
			'server',
			`--mount=${ pluginPath }:/wordpress/wp-content/plugins/${ wpPluginSlug }`,
			`--mount=${ packagesPath }:/wordpress/wp-content/packages`,
			`--blueprint=${ blueprintPath }`,
		];

		if ( argv.port !== undefined ) {
			args.push( `--port=${ argv.port }` );
		}

		if ( argv.verbose ) {
			console.log( chalk.gray( `Running: npx ${ args.join( ' ' ) }` ) );
		}

		await new Promise( ( resolve, reject ) => {
			const proc = child_process.spawn( 'npx', args, {
				stdio: [ 'inherit', 'pipe', 'inherit' ],
			} );

			proc.stdout.on( 'data', data => {
				process.stdout.write( data );

				// After Playground prints its "Ready!" line, show helpful info.
				if ( data.toString().includes( 'Ready!' ) ) {
					console.log();
					console.log( `  Admin:  ${ chalk.cyan( `http://127.0.0.1:${ port }/wp-admin/` ) }` );
					console.log( chalk.gray( '  Login:  admin / password' ) );
					console.log( chalk.gray( '  Stop:   Ctrl+C' ) );
					console.log();
				}
			} );

			proc.on( 'close', code => {
				if ( code !== 0 && code !== null ) {
					reject( new Error( `Playground exited with code ${ code }` ) );
				} else {
					resolve();
				}
			} );

			proc.on( 'error', reject );
		} );
	} finally {
		console.log( chalk.gray( 'Cleaning up temporary files...' ) );
		fs.rmSync( tmpDir, { recursive: true, force: true } );
	}
}

/**
 * Build a blueprint JSON file for the Playground session.
 *
 * Always injects a step to define JETPACK_DEV_DEBUG in wp-config.php so Jetpack
 * runs in offline mode without needing a WordPress.com connection. If the plugin
 * ships its own blueprint, the steps are merged.
 *
 * @param {string} pluginPath   - Absolute path to the plugin source directory.
 * @param {string} tmpDir       - Temporary directory to write the blueprint into.
 * @param {object} options      - CLI options (may include a custom blueprint path and plugin name).
 * @param {string} wpPluginSlug - The WordPress plugin slug (used for activation).
 * @return {string} Path to the generated blueprint file.
 */
function buildBlueprint( pluginPath, tmpDir, options, wpPluginSlug ) {
	// Start with a base blueprint.
	let blueprint = {
		$schema: 'https://playground.wordpress.net/blueprint-schema.json',
		landingPage: '/wp-admin/',
		login: true,
		features: {
			networking: true,
		},
		steps: [],
	};

	// Merge a user-provided or plugin-shipped blueprint.
	let sourceBlueprint = null;
	if ( options.blueprint ) {
		sourceBlueprint = path.resolve( options.blueprint );
		if ( ! fs.existsSync( sourceBlueprint ) ) {
			console.error( chalk.red( `Blueprint file not found: ${ sourceBlueprint }` ) );
			process.exit( 1 );
		}
	} else {
		const pluginBlueprintPath = path.join(
			pluginPath,
			'.wordpress-org',
			'blueprints',
			'blueprint.json'
		);
		if ( fs.existsSync( pluginBlueprintPath ) ) {
			sourceBlueprint = pluginBlueprintPath;
		}
	}

	if ( sourceBlueprint ) {
		console.log( chalk.gray( `Using blueprint: ${ path.relative( '.', sourceBlueprint ) }` ) );
		let custom;
		try {
			custom = JSON.parse( fs.readFileSync( sourceBlueprint, 'utf8' ) );
		} catch ( err ) {
			console.error( chalk.red( `Failed to parse blueprint: ${ err.message }` ) );
			process.exit( 1 );
		}
		blueprint = {
			...blueprint,
			...custom,
			// Merge steps — custom steps run first, then ours.
			steps: [ ...( custom.steps || [] ), ...blueprint.steps ],
		};
	}

	// The vendor symlinks resolve to /wordpress/wp-content/packages/ which is
	// outside WP_PLUGIN_DIR, so plugins_url() generates broken URLs like
	// /wp-content/plugins/wordpress/wp-content/packages/... Install a mu-plugin
	// that rewrites these URLs to the correct /wp-content/packages/ path.
	blueprint.steps.push( {
		step: 'writeFile',
		path: '/wordpress/wp-content/mu-plugins/playground-fix-symlinks.php',
		data: `<?php
/**
 * Fix plugins_url() for monorepo vendor symlinks in Playground.
 *
 * Vendor symlinks resolve outside WP_PLUGIN_DIR to /wordpress/wp-content/packages/.
 * This filter rewrites the broken URLs so the assets load correctly.
 */
add_filter( 'plugins_url', function ( $url ) {
	return str_replace( '/wp-content/plugins/wordpress/wp-content/packages/', '/wp-content/packages/', $url );
} );
`,
	} );

	// Inject the offline mode step: define JETPACK_DEV_DEBUG in wp-config.php.
	blueprint.steps.push( {
		step: 'defineWpConfigConsts',
		consts: {
			JETPACK_DEV_DEBUG: true,
		},
	} );

	// Activate the plugin using the WordPress plugin identifier (slug/main-file.php).
	const mainFile = findMainPluginFile( pluginPath );
	if ( mainFile ) {
		blueprint.steps.push( {
			step: 'activatePlugin',
			pluginPath: `${ wpPluginSlug }/${ mainFile }`,
		} );
	}

	// Write the merged blueprint to the temp directory.
	const blueprintOutPath = path.join( tmpDir, 'blueprint.json' );
	fs.writeFileSync( blueprintOutPath, JSON.stringify( blueprint, null, '\t' ) );

	return blueprintOutPath;
}

/**
 * Find the main plugin PHP file by looking for the "Plugin Name:" header
 * in root-level PHP files.
 *
 * @param {string} pluginPath - Absolute path to the plugin directory.
 * @return {string|null} The filename of the main plugin file, or null if not found.
 */
function findMainPluginFile( pluginPath ) {
	const entries = fs.readdirSync( pluginPath, { withFileTypes: true } );
	for ( const entry of entries ) {
		if ( ! entry.isFile() || ! entry.name.endsWith( '.php' ) ) {
			continue;
		}
		const content = fs.readFileSync( path.join( pluginPath, entry.name ), 'utf8' );
		if ( /^\s*\*?\s*Plugin Name:/m.test( content ) ) {
			return entry.name;
		}
	}
	return null;
}
