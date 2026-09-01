import child_process from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import chalk from 'chalk';
import { projectDir } from '../helpers/install.js';
import { readComposerJson } from '../helpers/json.js';
import { maybePromptForPlugin } from './rsync.js';

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
		.option( 'debug', {
			type: 'boolean',
			default: false,
			description: 'Enable WP_DEBUG and SCRIPT_DEBUG (errors logged to /wp-content/debug.log)',
		} )
		.example( 'jetpack playground jetpack', 'Start Playground with the Jetpack plugin' )
		.example( 'jetpack playground boost', 'Start Playground with the Boost plugin' );
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

	const pluginPath = projectDir( `plugins/${ argv.plugin }` );

	// Read the plugin slug from composer.json so the mount path inside
	// Playground uses the correct wp-plugin-slug.
	const composerJson = readComposerJson( `plugins/${ argv.plugin }`, false );
	const wpPluginSlug =
		composerJson?.extra?.[ 'wp-plugin-slug' ] ??
		composerJson?.extra?.[ 'beta-plugin-slug' ] ??
		argv.plugin;

	// Build the blueprint into a temp directory.
	const tmpDir = fs.mkdtempSync( path.join( os.tmpdir(), `jetpack-playground-${ argv.plugin }-` ) );

	// The vendor/jetpack_vendor directories contain symlinks like
	// ../../../../packages/<name>/ which, from the plugin location at
	// /wordpress/wp-content/plugins/<slug>/jetpack_vendor/automattic/<pkg>,
	// resolve to /wordpress/wp-content/packages/<name>/. We mount
	// projects/packages there so these symlinks resolve to real files and
	// plugins_url() can generate correct URLs (paths stay under wp-content).
	const packagesPath = projectDir( 'packages' );

	const cleanup = () => {
		console.log( chalk.gray( 'Cleaning up temporary files...' ) );
		fs.rmSync( tmpDir, { recursive: true, force: true } );
	};

	// Ensure temp directory is cleaned up on Ctrl+C.
	const onSigInt = () => {
		cleanup();
		process.exit( 130 );
	};
	process.on( 'SIGINT', onSigInt );

	try {
		const blueprintPath = buildBlueprint( pluginPath, tmpDir, argv, wpPluginSlug, argv.plugin );

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

				// Parse the actual URL from Playground's output
				// (e.g. "WordPress is running on http://127.0.0.1:9400").
				const match = data.toString().match( /running on (http:\/\/[^\s]+)/ );
				if ( match ) {
					const siteUrl = match[ 1 ].replace( /\/$/, '' );
					console.log();
					console.log( `  Admin:  ${ chalk.cyan( `${ siteUrl }/wp-admin/` ) }` );
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
		process.removeListener( 'SIGINT', onSigInt );
		cleanup();
	}
}

/**
 * Build a blueprint JSON file for the Playground session.
 *
 * For the Jetpack plugin, injects a step to define JETPACK_DEV_DEBUG in wp-config.php
 * so it runs in offline mode without needing a WordPress.com connection. If the plugin
 * ships its own blueprint, the steps are merged.
 *
 * @param {string} pluginPath   - Absolute path to the plugin source directory.
 * @param {string} tmpDir       - Temporary directory to write the blueprint into.
 * @param {object} options      - CLI options (may include a custom blueprint path and plugin name).
 * @param {string} wpPluginSlug - The WordPress plugin slug (used for activation).
 * @param {string} pluginName   - The monorepo plugin directory name (e.g. 'jetpack').
 * @return {string} Path to the generated blueprint file.
 */
function buildBlueprint( pluginPath, tmpDir, options, wpPluginSlug, pluginName ) {
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
			throw new Error( `Blueprint file not found: ${ sourceBlueprint }` );
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
			throw new Error( `Failed to parse blueprint: ${ err.message }`, { cause: err } );
		}
		blueprint = {
			...blueprint,
			...custom,
			// Merge steps — custom steps run first, then ours.
			steps: [ ...( custom.steps || [] ), ...blueprint.steps ],
		};
	}

	// Playground enables WP_DEBUG by default, which causes PHP notices (e.g.
	// early textdomain loading) to produce output before headers are sent,
	// breaking the auto-login redirect. When debug is off we disable WP_DEBUG
	// entirely; when on we log errors to file instead of displaying them.
	if ( options.debug ) {
		blueprint.steps.push( {
			step: 'defineWpConfigConsts',
			consts: {
				WP_DEBUG: true,
				WP_DEBUG_DISPLAY: false,
				WP_DEBUG_LOG: true,
				SCRIPT_DEBUG: true,
			},
		} );
	} else {
		blueprint.steps.push( {
			step: 'defineWpConfigConsts',
			consts: {
				WP_DEBUG: false,
			},
		} );
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

	// Inject the offline mode step only for the Jetpack plugin itself.
	if ( pluginName === 'jetpack' ) {
		blueprint.steps.push( {
			step: 'defineWpConfigConsts',
			consts: {
				JETPACK_DEV_DEBUG: true,
			},
		} );
	}

	// Activate the plugin.
	blueprint.steps.push( {
		step: 'activatePlugin',
		pluginPath: `/wordpress/wp-content/plugins/${ wpPluginSlug }`,
	} );

	// Write the merged blueprint to the temp directory.
	const blueprintOutPath = path.join( tmpDir, 'blueprint.json' );
	fs.writeFileSync( blueprintOutPath, JSON.stringify( blueprint, null, '\t' ) );

	return blueprintOutPath;
}
