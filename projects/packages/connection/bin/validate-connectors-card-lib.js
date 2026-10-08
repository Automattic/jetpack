/* global __dirname */
/**
 * Checks on the Connectors card's built script module, shared by the post-build CLI script and the tests.
 */

const { execFileSync } = require( 'child_process' );
const { existsSync, readdirSync, readFileSync, statSync } = require( 'fs' );
const path = require( 'path' );

const CONNECTOR_CLASS_FILE = path.join(
	__dirname,
	'..',
	'src',
	'connectors',
	'class-jetpack-connector.php'
);
const SIZE_LIMIT = 60 * 1024;

// Markers of a bundled React.
const FORBIDDEN_MARKERS = [
	[ '__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED', 'a bundled React' ],
	[ 'react-stack-bottom-frame', 'a bundled React' ],
	[ 'jsx-runtime', 'a bundled React JSX runtime' ],
];

/**
 * Run a PHP snippet and decode the JSON it prints.
 *
 * @param {string} code - PHP code, without the opening tag. `$argv[1]` is `file`.
 * @param {string} file - File path passed to the snippet.
 * @return {*} Decoded value.
 */
function readPhpJson( code, file ) {
	return JSON.parse( execFileSync( 'php', [ '-r', code, file ], { encoding: 'utf8' } ) );
}

/**
 * Read a PHP asset file as JSON.
 *
 * @param {string} assetFile - Path to the `.asset.php` file.
 * @return {object} Asset data.
 */
function readAsset( assetFile ) {
	return readPhpJson( 'echo json_encode( require $argv[1] );', assetFile );
}

/**
 * Read where the PHP loads the card from.
 *
 * @param {string} classFile - Path to class-jetpack-connector.php.
 * @return {string} Module path without extension.
 */
function readModuleFile( classFile ) {
	const moduleFile = readPhpJson(
		'require $argv[1]; echo json_encode( Automattic\\Jetpack\\Connection\\Jetpack_Connector::MODULE_FILE );',
		classFile
	);
	return path.resolve( path.dirname( classFile ), moduleFile );
}

/**
 * Check the card's build output.
 *
 * @param {object}   build         - Build output to check.
 * @param {object}   build.asset   - Asset data.
 * @param {string[]} build.jsFiles - JS files emitted for the entry.
 * @param {string}   build.bundle  - Contents of the emitted JS.
 * @param {number}   build.size    - Size of the emitted JS in bytes.
 * @return {string[]} Problems found; empty when the build is valid.
 */
function checkConnectorsCard( { asset, jsFiles, bundle, size } ) {
	if ( ! asset || typeof asset !== 'object' || Array.isArray( asset ) ) {
		return [
			`The asset file returned ${ JSON.stringify( asset ) }, expected an associative array.`,
		];
	}

	const errors = [];
	const moduleDependencies = Array.isArray( asset.module_dependencies )
		? asset.module_dependencies
		: [];

	if ( asset.type !== 'module' ) {
		errors.push( `Asset type is ${ JSON.stringify( asset.type ) }, expected "module".` );
	}

	if (
		! moduleDependencies.some(
			dependency => dependency?.id === '@wordpress/connectors' && dependency.import === 'static'
		)
	) {
		errors.push( '@wordpress/connectors is not a static module dependency.' );
	}

	if ( jsFiles.length !== 1 ) {
		errors.push( `Expected one JS file, found ${ jsFiles.length }: ${ jsFiles.join( ', ' ) }.` );
	}

	for ( const [ marker, description ] of FORBIDDEN_MARKERS ) {
		if ( bundle.includes( marker ) ) {
			errors.push( `The bundle contains ${ description } ("${ marker }").` );
		}
	}

	if ( size > SIZE_LIMIT ) {
		errors.push( `The bundle is ${ size } bytes, over the ${ SIZE_LIMIT } byte limit.` );
	}

	return errors;
}

/**
 * Read the build output from where the PHP loads it, and check it.
 *
 * @param {string} [classFile] - Path to class-jetpack-connector.php.
 * @return {string[]} Problems found; empty when the build is valid.
 */
function validateConnectorsCard( classFile = CONNECTOR_CLASS_FILE ) {
	const moduleFile = readModuleFile( classFile );
	const jsFile = `${ moduleFile }.js`;
	const assetFile = `${ moduleFile }.asset.php`;

	if ( ! existsSync( jsFile ) || ! existsSync( assetFile ) ) {
		return [
			`Build output not found at ${ jsFile }, where Jetpack_Connector::MODULE_FILE points.`,
		];
	}

	return checkConnectorsCard( {
		asset: readAsset( assetFile ),
		jsFiles: readdirSync( path.dirname( jsFile ) ).filter( file => /\.m?js$/.test( file ) ),
		bundle: readFileSync( jsFile, 'utf8' ),
		size: statSync( jsFile ).size,
	} );
}

module.exports = {
	checkConnectorsCard,
	validateConnectorsCard,
	SIZE_LIMIT,
};
