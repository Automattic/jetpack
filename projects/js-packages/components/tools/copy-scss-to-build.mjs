import fs from 'node:fs/promises';
import path from 'node:path';

// `tools/` -> package root.
const packageRoot = path.resolve( import.meta.dirname, '..' );
const buildRoot = path.join( packageRoot, 'build' );

const IGNORED_DIRS = new Set( [ 'build', 'node_modules', '.git' ] );

/**
 * Check if a path exists.
 * @param {string} p - The path to check.
 * @return {Promise<boolean>} - True if the path exists, false otherwise.
 */
async function pathExists( p ) {
	try {
		await fs.access( p );

		return true;
	} catch {
		return false;
	}
}

/**
 * Copy a file preserving the relative path.
 * @param {string} srcFile - The path to the source file.
 * @return {Promise<void>} - A promise that resolves when the file is copied.
 */
async function copyFilePreservingRelativePath( srcFile ) {
	const relative = path.relative( packageRoot, srcFile );
	const destFile = path.join( buildRoot, relative );
	const destDir = path.dirname( destFile );

	await fs.mkdir( destDir, { recursive: true } );
	await fs.copyFile( srcFile, destFile );
}

/**
 * Main function.
 * @return {Promise<void>} - A promise that resolves when the files are copied.
 */
async function main() {
	// If build didn't run (or output path changed), don't do anything.
	if ( ! ( await pathExists( buildRoot ) ) ) {
		return;
	}

	for await ( const filePath of fs.glob( '**/*.{scss,css}', {
		cwd: packageRoot,
		exclude: Array.from( IGNORED_DIRS, dir => `**/${ dir }/**` ),
	} ) ) {
		const absolutePath = path.resolve( packageRoot, filePath );
		await copyFilePreservingRelativePath( absolutePath );
	}
}

await main();
