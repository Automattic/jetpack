import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath( import.meta.url );
const __dirname = path.dirname( __filename );

// `tools/` -> package root.
const packageRoot = path.resolve( __dirname, '..' );
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
 * Walk a directory and yield all files.
 * @param {string} dir - The directory to walk.
 * @yield {string} - A file path.
 * @return {AsyncGenerator<string>} - A generator of file paths.
 */
async function* walk( dir ) {
	const entries = await fs.readdir( dir, { withFileTypes: true } );

	for ( const entry of entries ) {
		const fullPath = path.join( dir, entry.name );

		if ( entry.isDirectory() ) {
			if ( IGNORED_DIRS.has( entry.name ) ) {
				continue;
			}

			yield* walk( fullPath );

			continue;
		}

		if ( entry.isFile() ) {
			yield fullPath;
		}
	}
}

/**
 * Check if a file is an SCSS file.
 * @param {string} filePath - The path to the file.
 * @return {boolean} - True if the file is an SCSS file, false otherwise.
 */
function isScssFile( filePath ) {
	return filePath.endsWith( '.scss' );
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

	for await ( const filePath of walk( packageRoot ) ) {
		if ( ! isScssFile( filePath ) ) {
			continue;
		}

		await copyFilePreservingRelativePath( filePath );
	}
}

await main();
