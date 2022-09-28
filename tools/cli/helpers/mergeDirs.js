import fs from 'fs';
import path from 'path';

/**
 * Merge directories.
 *
 * Originally from https://github.com/binocarlos/merge-dirs/blob/master/src/index.js
 *
 * @param {string} src - Source dir.
 * @param {string} dest - Dest dir.
 * @param {string} name - Name of new project.
 */
export default function mergeDirs( src, dest, name ) {
	if ( ! src || ! dest ) {
		throw new Error( 'Both a source and destination path must be provided.' );
	}
	const files = fs.readdirSync( src );

	if ( ! files ) {
		throw new Error( 'Source must have files to copy.' );
	}

	files.forEach( file => {
		const srcFile = '' + src + '/' + file;
		const destFile = '' + dest + '/' + file;
		const stats = fs.lstatSync( srcFile );

		if ( stats.isDirectory() ) {
			mergeDirs( srcFile, destFile );
		} else if ( stats.isSymbolicLink() ) {
			return;
		} else if ( ! fs.existsSync( destFile ) ) {
			copyFile( destFile, srcFile );
		} else {
			console.warn( `${ destFile } exists, skipping...` );
		}

		if ( file === 'plugin.php' ) {
			const newFile = path.join( destFile, '../', name + '.php' );
			fs.rename( destFile, newFile, err => {
				if ( err ) {
					throw new Error( 'Error renaming plugin.php: ' + err );
				}
			} );
		}
	} );
}

/**
 * Copy file.
 *
 * Originally from https://github.com/binocarlos/merge-dirs/blob/master/src/index.js
 *
 * @param {string} file - Destination file path
 * @param {string} location - Current location.
 */
export function copyFile( file, location ) {
	fs.mkdirSync( file.split( '/' ).slice( 0, -1 ).join( '/' ), { mode: 0x1ed, recursive: true } );
	fs.writeFileSync( file, fs.readFileSync( location ) );
}
