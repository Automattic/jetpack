import child_process from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import chalk from 'chalk';
import { dirs } from '../helpers/projectHelpers.js';
import { chalkJetpackGreen } from '../helpers/styling.js';

/**
 * Command definition for the playground subcommand.
 *
 * @param {object} yargs - The Yargs dependency.
 * @return {object} Yargs with the playground commands defined.
 */
export function playgroundDefine( yargs ) {
	yargs.command(
		'playground <plugin>',
		'Starts a WordPress Playground instance with a plugin mounted',
		yarg => {
			yarg
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
		},
		async argv => {
			await playgroundCli( argv );
		}
	);

	return yargs;
}

/**
 * Build a blueprint JSON file for the Playground session.
 *
 * Always injects a step to define JETPACK_DEV_DEBUG in wp-config.php so Jetpack
 * runs in offline mode without needing a WordPress.com connection. If the plugin
 * ships its own blueprint, the steps are merged.
 *
 * @param {string} pluginPath - Absolute path to the plugin source directory.
 * @param {string} mountPath  - Absolute path to the resolved plugin copy in the temp dir.
 * @param {object} options    - CLI options (may include a custom blueprint path).
 * @return {string} Path to the generated blueprint file.
 */
function buildBlueprint( pluginPath, mountPath, options ) {
	const tmpDir = path.dirname( mountPath );

	// Start with a base blueprint.
	let blueprint = {
		$schema: 'https://playground.wordpress.net/blueprint-schema.json',
		landingPage: '/wp-admin/',
		login: true,
		preferredVersions: {
			php: '8.0',
			wp: 'latest',
		},
		features: {
			networking: true,
		},
		steps: [],
	};

	// Merge a user-provided or plugin-shipped blueprint.
	let sourceBlueprint = null;
	if ( options.blueprint ) {
		sourceBlueprint = path.resolve( options.blueprint );
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
		const custom = JSON.parse( fs.readFileSync( sourceBlueprint, 'utf8' ) );
		blueprint = {
			...blueprint,
			...custom,
			// Merge steps — custom steps run first, then ours.
			steps: [ ...( custom.steps || [] ) ],
		};
	}

	// Inject the offline mode step: define JETPACK_DEV_DEBUG in wp-config.php.
	blueprint.steps.push( {
		step: 'defineWpConfigConsts',
		consts: {
			JETPACK_DEV_DEBUG: true,
		},
	} );

	// Write the merged blueprint to the temp directory.
	const blueprintOutPath = path.join( tmpDir, 'blueprint.json' );
	fs.writeFileSync( blueprintOutPath, JSON.stringify( blueprint, null, '\t' ) );

	return blueprintOutPath;
}

/**
 * Entry point for the playground CLI.
 *
 * @param {object} options - The argv for the command line.
 */
async function playgroundCli( options ) {
	const pluginPath = path.resolve( `projects/plugins/${ options.plugin }` );

	// Validate that the plugin exists.
	if ( ! fs.existsSync( pluginPath ) ) {
		const available = dirs( './projects/plugins' );
		console.error( chalk.red( `Plugin "${ options.plugin }" not found.` ) );
		if ( available.length > 0 ) {
			console.error( `\nAvailable plugins: ${ available.join( ', ' ) }` );
		}
		process.exit( 1 );
	}

	// Check if the plugin has been built (vendor directories must exist).
	const vendorPath = path.join( pluginPath, 'vendor' );
	const jetpackVendorPath = path.join( pluginPath, 'jetpack_vendor' );
	if ( ! fs.existsSync( vendorPath ) || ! fs.existsSync( jetpackVendorPath ) ) {
		console.log(
			chalk.yellow(
				`Plugin "${ options.plugin }" has not been built yet. Running install and build...`
			)
		);

		const install = child_process.spawnSync(
			'jetpack',
			[ 'install', `plugins/${ options.plugin }` ],
			{ shell: true, stdio: 'inherit' }
		);
		if ( install.status !== 0 ) {
			console.error( chalk.red( 'Install failed. Please run "jetpack install" manually.' ) );
			process.exit( 1 );
		}

		const build = child_process.spawnSync( 'jetpack', [ 'build', `plugins/${ options.plugin }` ], {
			shell: true,
			stdio: 'inherit',
		} );
		if ( build.status !== 0 ) {
			console.error( chalk.red( 'Build failed. Please run "jetpack build" manually.' ) );
			process.exit( 1 );
		}
	}

	// Use `jetpack rsync` to create a resolved copy in a temp dir.
	// This reuses the existing rsync logic which properly resolves monorepo
	// symlinks and only includes production files.
	const tmpDir = fs.mkdtempSync(
		path.join( os.tmpdir(), `jetpack-playground-${ options.plugin }-` )
	);
	const mountPath = path.join( tmpDir, options.plugin );

	console.log( chalk.gray( 'Syncing plugin files (resolving monorepo symlinks)...' ) );

	const rsyncResult = child_process.spawnSync(
		'jetpack',
		[ 'rsync', options.plugin, mountPath, '--non-interactive' ],
		{ shell: true, stdio: 'inherit' }
	);
	if ( rsyncResult.status !== 0 ) {
		console.error( chalk.red( 'Failed to sync plugin files.' ) );
		fs.rmSync( tmpDir, { recursive: true, force: true } );
		process.exit( 1 );
	}

	// Build the blueprint. We always inject a step to enable Jetpack offline mode
	// (JETPACK_DEV_DEBUG) so the plugin works without a WordPress.com connection.
	const blueprintPath = buildBlueprint( pluginPath, mountPath, options );

	console.log(
		chalkJetpackGreen( `Starting WordPress Playground with plugins/${ options.plugin }...` )
	);

	const args = [ '@wp-playground/cli', 'server', '--auto-mount', `--blueprint=${ blueprintPath }` ];

	if ( options.port ) {
		args.push( `--port=${ options.port }` );
	}

	if ( options.verbose ) {
		console.log( chalk.gray( `Running: npx ${ args.join( ' ' ) }` ) );
		console.log( chalk.gray( `Synced copy: ${ mountPath }` ) );
	}

	try {
		child_process.spawnSync( 'npx', args, {
			cwd: mountPath,
			shell: true,
			stdio: 'inherit',
		} );
	} finally {
		// Clean up the temporary copy.
		console.log( chalk.gray( 'Cleaning up temporary files...' ) );
		fs.rmSync( tmpDir, { recursive: true, force: true } );
	}
}
