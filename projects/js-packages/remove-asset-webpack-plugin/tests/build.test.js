const fs = require( 'fs/promises' );
const os = require( 'os' );
const path = require( 'path' );
const webpack = require( 'webpack' );
const RemoveAssetWebpackPlugin = require( '../src/index.js' );

let tmpdir = null;

/**
 * Set up a temporary directory.
 *
 * The path is stored in `tmpdir`.
 */
async function mktmpdir() {
	if ( tmpdir ) {
		await fs.rm( tmpdir, { force: true, recursive: true } );
		tmpdir = null;
	}
	tmpdir = await fs.mkdtemp( path.join( os.tmpdir(), 'remove-asset-webpack-plugin-' ) );
	await fs.writeFile(
		path.join( tmpdir, 'foo.js' ),
		'console.log( "hello" );\nimport( /* webpackChunkName: "bar" */ "./bar.js" );\n'
	);
	await fs.writeFile( path.join( tmpdir, 'bar.js' ), 'console.log( "goodbye" );\n' );
	await fs.writeFile( path.join( tmpdir, 'baz.js' ), 'console.log( "buzz" );\n' );
}

// Clean up after each test.
afterEach( async () => {
	// Clean up the temporary directory, if any.
	if ( tmpdir ) {
		await fs.rm( tmpdir, { force: true, recursive: true } );
		tmpdir = null;
	}
} );

const cases = [
	[ 'string', 'main.js', [ 'bar.js', 'bar.js.map', 'baz.js', 'baz.js.map', 'main.js.map' ] ],
	[ 'regex', /^ba.\.js(\.map)?$/, [ 'main.js', 'main.js.map' ] ],
	[ 'function', name => name.endsWith( '.map' ), [ 'bar.js', 'baz.js', 'main.js' ] ],
	[ 'array', [ 'main.js', 'main.js.map' ], [ 'bar.js', 'bar.js.map', 'baz.js', 'baz.js.map' ] ],
];

test.each( cases )( 'Match by %s', async ( name, match, expect_files ) => {
	await mktmpdir();
	const builddir = path.join( tmpdir, 'build' );

	const config = {
		context: tmpdir,
		entry: {
			main: './foo.js',
			baz: './baz.js',
		},
		mode: 'development',
		devtool: 'source-map',
		output: {
			path: builddir,
		},
		plugins: [
			new RemoveAssetWebpackPlugin( {
				assets: match,
			} ),
		],
	};

	const stats = await new Promise( ( resolve, reject ) => {
		// eslint-disable-next-line no-shadow
		webpack( config, ( err, stats ) => {
			if ( err !== null ) {
				reject( err );
			} else {
				resolve( stats );
			}
		} );
	} );
	expect( stats.toJson( { all: false, errors: true, warnings: true } ) ).toEqual( {
		errors: [],
		warnings: [],
	} );

	const files = await fs.readdir( builddir );
	expect( files.sort() ).toEqual( expect_files );
} );
