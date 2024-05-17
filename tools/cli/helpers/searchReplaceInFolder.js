import fs from 'fs';
import path from 'path';

/**
 * Search and replace strings inside all files in a folder.
 *
 * @param {string} folder - The folder.
 * @param {string} search - String to search for.
 * @param {string} replace - String to replace with.
 * @returns {Promise} Promise that resolves once all replacements are done
 */
export default function searchReplaceInFolder( folder, search, replace ) {
	const files = fs.readdirSync( folder );

	if ( ! files ) {
		throw new Error( 'Folder must have files.' );
	}

	return new Promise( resolve => {
		const totalFiles = files.length;
		let count = 0;
		files.forEach( file => {
			count++;
			const fileName = path.join( folder, '/' + file );
			const stats = fs.lstatSync( fileName );

			if ( stats.isDirectory() ) {
				searchReplaceInFolder( fileName, search, replace );
			} else if ( stats.isSymbolicLink() ) {
				return;
			} else {
				fs.readFile( fileName, 'utf8', ( err, fileContents ) => {
					if ( ! err ) {
						const replaced = fileContents.replaceAll( search, replace );
						fs.writeFile( fileName, replaced, 'utf8', error => {
							if ( error ) {
								console.erroror( error );
							}
							if ( count >= totalFiles ) {
								resolve();
							}
						} );
					}
				} );
			}
		} );
	} );
}
