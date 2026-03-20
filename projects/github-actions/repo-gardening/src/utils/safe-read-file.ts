import fs from 'fs';
import path from 'path';

/**
 * Read a file safely, rejecting symlinks and paths that escape a boundary directory.
 *
 * @param filePath    - Absolute path to the file to read.
 * @param boundaryDir - Absolute path to the directory the file must reside within.
 * @return File contents as a string.
 */
export function safeReadFileSync( filePath: string, boundaryDir: string ): string {
	// Reject direct symlinks (lstatSync does NOT follow symlinks).
	const stat = fs.lstatSync( filePath );
	if ( stat.isSymbolicLink() ) {
		throw new Error( `Refusing to read symlink: ${ filePath }` );
	}

	// Resolve the full chain and verify the result stays within the boundary.
	// This catches symlinks on intermediate directory components.
	const realPath = fs.realpathSync( filePath );
	const realBoundary = fs.realpathSync( boundaryDir );
	const relative = path.relative( realBoundary, realPath );
	if (
		relative.startsWith( '..' + path.sep ) ||
		relative === '..' ||
		path.isAbsolute( relative )
	) {
		throw new Error( `Path escapes workspace boundary: ${ filePath }` );
	}

	return fs.readFileSync( realPath ).toString();
}

/**
 * Parse JSON without leaking file content in error messages.
 *
 * @param content - The string to parse.
 * @param label   - A label for error messages (typically the file path).
 * @return Parsed JSON value.
 */
export function safeJsonParse( content: string, label: string ): unknown {
	try {
		return JSON.parse( content );
	} catch {
		throw new Error( `Invalid JSON in ${ label }` );
	}
}
