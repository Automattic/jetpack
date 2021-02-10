/**
 * External dependencies
 */
import fs from 'fs';

/**
 * Merge directories.
 *
 * Originally from https://github.com/binocarlos/merge-dirs/blob/master/src/index.js

 * @param src
 * @param dest
 */
export default function mergeDirs( src, dest ) {
	if ( ! src || ! dest ) {
		throw new Error( 'Both a source and destination path must be provided.' );
	}

	const files = fs.readdirSync( src );

	files.forEach( file => {
		const srcFile = '' + src + '/' + file;
		const destFile = '' + dest + '/' + file;
		const stats = fs.lstatSync( srcFile );

		if ( stats.isDirectory() ) {
			mergeDirs( srcFile, destFile );
		} else if ( ! fs.existsSync( destFile ) ) {
			copyFile( destFile, srcFile );
		} else {
			console.warn( `${ destFile } exists, skipping...` );
		}
	} );
}

/**
 * Copy file.
 *
 * Originally from https://github.com/binocarlos/merge-dirs/blob/master/src/index.js
 *
 * @param file
 * @param location
 */
function copyFile( file, location ) {
	fs.mkdirSync( file.split( '/' ).slice( 0, -1 ).join( '/' ), { mode: 0x1ed, recursive: true } );
	fs.writeFileSync( file, fs.readFileSync( location ) );
}
