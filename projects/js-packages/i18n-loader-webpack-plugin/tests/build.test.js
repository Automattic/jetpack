const fs = require( 'fs' );
const path = require( 'path' );
const webpack = require( 'webpack' );

require( './globals' );

/**
 * Extract a section from a string.
 *
 * @param {string} content - String to extract from.
 * @param {string} start - Starting line.
 * @param {string} end - Line to end before.
 * @returns {string|null} Section.
 */
function extractSection( content, start, end ) {
	const s = content.indexOf( '\n' + start );
	if ( s < 0 ) {
		return null;
	}
	const e = content.indexOf( '\n' + end, s + 1 );
	return content.substring( s + 1, e > s ? e : content.length );
}

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

beforeEach( () => {
	global.jpI18nLoader.expect = {};
} );

const fixturesPath = path.join( __dirname, 'fixtures' );
const configFixtures = fs.readdirSync( fixturesPath ).sort();

describe.each( configFixtures )( 'Webpack `%s`', fixture => {
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

	let err, stats;
	beforeAll( async () => {
		[ err, stats ] = await new Promise( resolve => {
			// eslint-disable-next-line no-shadow
			webpack( config, ( err, stats ) => {
				resolve( [ err, stats ] );
			} );
		} );
	} );

	test( 'Build results', () => {
		expect( err ).toMatchSnapshot( 'Webpack build error' );

		// Webpack's error messages may contain full paths. Munge those.
		const mungePaths = x => {
			if ( typeof x === 'string' ) {
				return x.replace( __dirname, '/path/to/i18n-loader-webpack-plugin/tests' );
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
		const statsOut = mungePaths( stats.toJson( { all: false, errors: true, warnings: true } ) );
		expect( statsOut ).toMatchSnapshot( 'Webpack build stats' );

		if ( err !== null || stats.hasErrors() ) {
			return;
		}

		const files = {};
		for ( const file of lsFiles( builddir ) ) {
			const data = {};
			if ( file.endsWith( '.js' ) ) {
				const content = fs.readFileSync( path.join( builddir, file ), { encoding: 'utf8' } );
				data.jpI18nState = extractSection(
					content,
					'/***/ "@wordpress/jp-i18n-loader":\n',
					'/***/ })'
				);
				data.loader = extractSection(
					content,
					'/******/ \t/* webpack/runtime/loading @automattic/i18n-loader-webpack-plugin */',
					'/******/ \t\n'
				);
			}
			files[ file ] = data;
		}
		expect( files ).toMatchSnapshot( 'Webpack build files' );
	} );

	const testfile = path.join( testdir, 'tests.js' );
	if ( fs.existsSync( testfile ) ) {
		require( testfile );
	}
} );
