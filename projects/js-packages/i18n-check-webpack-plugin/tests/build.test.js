const fs = require( 'fs' );
const path = require( 'path' );
const webpack = require( 'webpack' );

const fixturesPath = path.join( __dirname, 'fixtures' );
const configFixtures = fs.readdirSync( fixturesPath ).sort();

/**
 * Find all files in a path.
 *
 * @param {string} dir - Path.
 * @returns {string[]} Promise resolving to a list of files.
 */
function lsFiles( dir ) {
	const ret = [];
	for ( const dirent of fs.readdirSync( dir, { withFileTypes: true } ) ) {
		if ( dirent.isDirectory() ) {
			for ( const file of lsFiles( path.join( dir, dirent.name ) ) ) {
				ret.push( path.join( dirent.name, file ) );
			}
		} else {
			ret.push( dirent.name );
		}
	}
	return ret;
}

test.each( configFixtures )(
	'Webpack `%s`',
	async fixture => {
		const testdir = path.join( fixturesPath, fixture );
		const builddir = path.join( testdir, 'dist' );
		fs.rmSync( builddir, { force: true, recursive: true } );

		const config = require( path.join( testdir, 'webpack.config.js' ) );
		if ( Array.isArray( config ) ) {
			for ( const c of config ) {
				c.context = c.context || testdir;
				c.output.path = builddir;
			}
		} else {
			config.context = config.context || testdir;
			config.output.path = builddir;
		}

		const [ err, stats ] = await new Promise( resolve => {
			// eslint-disable-next-line no-shadow
			webpack( config, ( err, stats ) => {
				resolve( [ err, stats ] );
			} );
		} );

		expect( err ).toMatchSnapshot( 'Webpack build error' );

		// Webpack's error messages may contain full paths. Munge those.
		const mungePaths = x => {
			if ( typeof x === 'string' ) {
				return x.replace( __dirname, '/path/to/i18n-check-webpack-plugin/tests' );
			}
			if ( Array.isArray( x ) ) {
				return x.map( mungePaths );
			}
			if ( typeof x === 'object' && Object.getPrototypeOf( x ) === Object.prototype ) {
				return Object.fromEntries(
					Object.entries( x ).map( ( [ k, v ] ) => [ k, mungePaths( v ) ] )
				);
			}
			return x;
		};
		const statsOut = stats
			? mungePaths( stats.toJson( { all: false, errors: true, warnings: true } ) )
			: null;
		expect( statsOut ).toMatchSnapshot( 'Webpack build stats' );

		expect( lsFiles( builddir ) ).toMatchSnapshot( 'Webpack build files' );

		if ( fixture === 'dropped-is-ok' ) {
			const contents = fs.readFileSync( path.join( builddir, 'main.js' ), { encoding: 'utf8' } );
			// eslint-disable-next-line jest/no-conditional-expect
			expect( contents ).toEqual( expect.stringContaining( 'This is production' ) );
			// eslint-disable-next-line jest/no-conditional-expect
			expect( contents ).toEqual( expect.not.stringContaining( 'This is not production' ) );
		}
	},
	15000
);
