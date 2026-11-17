/**
 * External dependencies
 */
import fs from 'fs';
import path from 'path';

const PACKAGE_ROOT = path.join( __dirname, '..', '..' );

/**
 * Gets the directory a package is installed in, as resolved from another directory.
 *
 * @param {string} name - Package name.
 * @param {string} from - Directory the resolution starts from.
 * @return {string} The package's real directory.
 */
function installedDir( name: string, from: string ): string {
	return fs.realpathSync(
		path.dirname( require.resolve( `${ name }/package.json`, { paths: [ from ] } ) )
	);
}

// `externals` re-exports Base UI parts beside `@wordpress/ui`, which is built on Base UI. Bumping
// one without the other installs two copies, and the module compiles both in.
it( 'resolves the Base UI copy @wordpress/ui is built on', () => {
	const designSystemDir = installedDir( '@wordpress/ui', PACKAGE_ROOT );

	expect( installedDir( '@base-ui/react', PACKAGE_ROOT ) ).toBe(
		installedDir( '@base-ui/react', designSystemDir )
	);
} );
