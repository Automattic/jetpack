#!/usr/bin/env node

import { spawnSync } from 'child_process';
import fs from 'fs';
import { dirname, resolve } from 'path';
import process from 'process';
import chalk from 'chalk';
import prompts from 'prompts';

/**
 * Check if a directory is the monorepo root.
 *
 * @param {string} dir - Directory to check
 * @return {boolean} True if this is the monorepo root
 */
const isMonorepoRoot = dir => {
	try {
		return fs.existsSync( resolve( dir, 'tools/docker/bin/monorepo' ) );
	} catch {
		return false;
	}
};

/**
 * Find monorepo root from a starting directory.
 *
 * @param {string} startDir - Directory to start searching from
 * @return {string|null} Path to monorepo root, or null if not found
 */
const findMonorepoRoot = startDir => {
	let dir = startDir;
	while ( dir !== '/' ) {
		if ( isMonorepoRoot( dir ) ) {
			return dir;
		}
		dir = dirname( dir );
	}
	return null;
};

/**
 * Clone the monorepo.
 *
 * @param {string} targetDir - Directory to clone into
 * @throws {Error} If clone fails
 */
const cloneMonorepo = async targetDir => {
	// eslint-disable-next-line no-console
	console.log( chalk.blue( 'Cloning Jetpack monorepo...' ) );
	const result = spawnSync(
		'git',
		[ 'clone', 'https://github.com/Automattic/jetpack.git', targetDir ],
		{ stdio: 'inherit' }
	);

	if ( result.status !== 0 ) {
		throw new Error( 'Failed to clone repository' );
	}
};

/**
 * Initialize a new Jetpack development environment.
 *
 * @throws {Error} If initialization fails
 */
const initJetpack = async () => {
	const response = await prompts( {
		type: 'text',
		name: 'directory',
		message: 'Where would you like to clone the Jetpack monorepo?',
		initial: './jetpack',
	} );

	if ( ! response.directory ) {
		throw new Error( 'Setup cancelled' );
	}

	const targetDir = resolve( process.cwd(), response.directory );

	if ( fs.existsSync( targetDir ) ) {
		throw new Error( `Directory ${ targetDir } already exists` );
	}

	try {
		await cloneMonorepo( targetDir );
		// eslint-disable-next-line no-console
		console.log( chalk.green( '\nJetpack monorepo has been cloned successfully!' ) );
		// eslint-disable-next-line no-console
		console.log( '\nNext steps:' );
		// eslint-disable-next-line no-console
		console.log( '1. cd', response.directory );
		// eslint-disable-next-line no-console
		console.log( '2. jp docker up' );
		// eslint-disable-next-line no-console
		console.log( '3. jp docker install' );
	} catch ( error ) {
		throw new Error( `Failed to initialize Jetpack: ${ error.message }` );
	}
};

// Main execution
const main = async () => {
	try {
		const args = process.argv.slice( 2 );

		// Handle 'init' command specially
		if ( args[ 0 ] === 'init' ) {
			await initJetpack();
			return;
		}

		// Try to find monorepo root from current directory
		const monorepoRoot = findMonorepoRoot( process.cwd() );

		if ( ! monorepoRoot ) {
			// eslint-disable-next-line no-console
			console.error( chalk.red( 'Could not find Jetpack monorepo.' ) );
			// eslint-disable-next-line no-console
			console.log( '\nTo get started:' );
			// eslint-disable-next-line no-console
			console.log( '1. Run', chalk.blue( 'jp init' ), 'to clone the repository' );
			// eslint-disable-next-line no-console
			console.log( '   OR' );
			// eslint-disable-next-line no-console
			console.log( '2. Navigate to an existing Jetpack monorepo directory' );
			throw new Error( 'Monorepo not found' );
		}

		// Run the monorepo script with the original arguments
		const result = spawnSync(
			resolve( monorepoRoot, 'tools/docker/bin/monorepo' ),
			[ 'pnpm', 'jetpack', ...args ],
			{
				stdio: 'inherit',
				shell: true,
				cwd: monorepoRoot, // Ensure we're in the monorepo root when running commands
			}
		);

		if ( result.status !== 0 ) {
			throw new Error( `Command failed with status ${ result.status }` );
		}
	} catch ( error ) {
		// eslint-disable-next-line no-console
		console.error( chalk.red( error.message ) );
		process.exitCode = 1;
	}
};

main();
