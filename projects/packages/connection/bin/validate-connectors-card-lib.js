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
 * Read the constants the PHP loads the card with.
 *
 * @param {string} classFile - Path to class-jetpack-connector.php.
 * @return {{ moduleFile: string, moduleDependencyIds: string[] }} Module path without extension, and module IDs.
 */
function readConnectorConstants( classFile ) {
	const constants = readPhpJson(
		'require $argv[1]; $c = Automattic\\Jetpack\\Connection\\Jetpack_Connector::class; echo json_encode( array( $c::MODULE_FILE, array_column( $c::MODULE_DEPENDENCIES, "id" ) ) );',
		classFile
	);
	return {
		moduleFile: path.resolve( path.dirname( classFile ), constants[ 0 ] ),
		moduleDependencyIds: constants[ 1 ],
	};
}

/**
 * Check the card's build output.
 *
 * @param {object}   build                     - Build output to check.
 * @param {object}   build.asset               - Asset data.
 * @param {string[]} build.moduleDependencyIds - Module IDs the PHP declares.
 * @param {string[]} build.jsFiles             - JS files emitted for the entry.
 * @param {string}   build.bundle              - Contents of the emitted JS.
 * @param {number}   build.size                - Size of the emitted JS in bytes.
 * @return {string[]} Problems found; empty when the build is valid.
 */
function checkConnectorsCard( { asset, moduleDependencyIds, jsFiles, bundle, size } ) {
	const errors = [];
	const dependencies = Array.isArray( asset.dependencies ) ? asset.dependencies : [];

	if ( asset.type !== 'module' ) {
		errors.push( `Asset type is ${ JSON.stringify( asset.type ) }, expected "module".` );
	}

	if ( ! dependencies.includes( '@wordpress/connectors' ) ) {
		errors.push( '@wordpress/connectors is not a static dependency.' );
	}

	for ( const dependency of dependencies ) {
		const id = typeof dependency === 'string' ? dependency : dependency?.id;
		if ( typeof id === 'string' && id.startsWith( '@' ) && ! moduleDependencyIds.includes( id ) ) {
			errors.push(
				`The bundle imports the script module ${ id }, which Jetpack_Connector::MODULE_DEPENDENCIES does not declare.`
			);
		}
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
	const { moduleFile, moduleDependencyIds } = readConnectorConstants( classFile );
	const jsFile = `${ moduleFile }.js`;
	const assetFile = `${ moduleFile }.asset.php`;

	if ( ! existsSync( jsFile ) || ! existsSync( assetFile ) ) {
		return [
			`Build output not found at ${ jsFile }, where Jetpack_Connector::MODULE_FILE points.`,
		];
	}

	return checkConnectorsCard( {
		asset: readAsset( assetFile ),
		moduleDependencyIds,
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
