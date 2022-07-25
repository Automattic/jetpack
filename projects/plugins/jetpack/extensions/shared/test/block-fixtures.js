import fs from 'fs';
import path from 'path';
import { format } from 'util';
import { parse as grammarParse } from '@wordpress/block-serialization-default-parser';
import { parse, serialize, registerBlockType, setCategories } from '@wordpress/blocks';
import { __, sprintf } from '@wordpress/i18n';
import { omit, uniq } from 'lodash';

let FIXTURES_DIR;

/* eslint-disable jest/no-export */

/**
 * Run block fixture tests.
 *
 * @param {string} blockName - Block name.
 * @param {Array} blocks - Blocks.
 * @param {string} fixturesPath - Fixtures path.
 */
export default function runBlockFixtureTests( blockName, blocks, fixturesPath ) {
	registerBlocks( blocks );
	setFixturesDir( fixturesPath );

	const blockBasenames = getAvailableBlockFixturesBasenames();
	let primaryBlockSettings;
	try {
		primaryBlockSettings = blocks.find( block => block.name === blockName ).settings;
	} catch ( err ) {
		throw new Error( `Settings can't be found for main block under test: ${ blockName }` );
	}

	if ( process.env.REGENERATE_FIXTURES ) {
		const fullPath = `${ fixturesPath }/fixtures`;
		const regex = /[.]json|serialized\.html$/;
		fs.readdirSync( fullPath )
			.filter( file => regex.test( file ) )
			.forEach( file => fs.unlinkSync( `${ fullPath }/${ file }` ) );
	}

	describe( 'Test block content parsing', () => {
		blockBasenames.forEach( basename => {
			// eslint-disable-next-line jest/valid-title
			test( `all content versions parse correctly for block ${ blockName }`, () => {
				const { filename: htmlFixtureFileName, file: htmlFixtureContent } = getBlockFixtureHTML(
					basename
				);
				if ( htmlFixtureContent === null ) {
					throw new Error( `Missing fixture file: ${ htmlFixtureFileName }` );
				}

				const {
					filename: parsedJSONFixtureFileName,
					file: parsedJSONFixtureContent,
				} = getBlockFixtureParsedJSON( basename );
				const parserOutputActual = grammarParse( htmlFixtureContent );
				let parserOutputExpectedString;
				if ( parsedJSONFixtureContent ) {
					parserOutputExpectedString = parsedJSONFixtureContent;
				} else if ( process.env.GENERATE_MISSING_FIXTURES ) {
					parserOutputExpectedString = JSON.stringify( parserOutputActual, null, 4 ) + '\n';
					writeBlockFixtureParsedJSON( basename, parserOutputExpectedString );
				} else {
					throw new Error( `Missing fixture file: ${ parsedJSONFixtureFileName }` );
				}

				const parserOutputExpected = JSON.parse( parserOutputExpectedString );
				try {
					expect( parserOutputActual ).toEqual( parserOutputExpected );
				} catch ( err ) {
					throw new Error(
						format(
							"File '%s' does not match expected value:\n\n%s",
							parsedJSONFixtureFileName,
							err.message
						)
					);
				}

				// @wordpress/blocks may call these. Noop them to avoid unnecessary output.
				jest.spyOn( console, 'groupCollapsed' ).mockReset();
				jest.spyOn( console, 'groupEnd' ).mockReset();

				const blocksActual = parse( htmlFixtureContent );

				// eslint-disable-next-line no-console
				console.groupCollapsed.mockRestore();
				// eslint-disable-next-line no-console
				console.groupEnd.mockRestore();

				// @wordpress/blocks needlessly calls console.info. Ignore that.
				// eslint-disable-next-line no-console
				console.info.mockClear();

				// Block validation may log errors during deprecation migration,
				// unless explicitly handled from a valid block via isEligible.
				// Match on basename for deprecated blocks fixtures to allow.
				const isDeprecated = /__deprecated([-_]|$)/.test( basename );
				if ( isDeprecated ) {
					// eslint-disable-next-line no-console
					console.warn.mockClear();
					// eslint-disable-next-line no-console
					console.error.mockClear();
				}

				const validationIssues = gatherValidationIssues( blocksActual );
				const blocksActualNormalized = normalizeParsedBlocks( blocksActual );
				const { filename: jsonFixtureFileName, file: jsonFixtureContent } = getBlockFixtureJSON(
					basename
				);

				let blocksExpectedString;

				if ( jsonFixtureContent ) {
					blocksExpectedString = jsonFixtureContent;
				} else if ( process.env.GENERATE_MISSING_FIXTURES ) {
					// Validation issues add too much noise so they get removed.
					blocksExpectedString = JSON.stringify( blocksActualNormalized, null, 4 ) + '\n';
					writeBlockFixtureJSON( basename, blocksExpectedString );
				} else {
					throw new Error( `Missing fixture file: ${ jsonFixtureFileName }` );
				}

				const blocksExpected = JSON.parse( blocksExpectedString );

				if ( blocksExpected?.length ) {
					blocksExpected.forEach( ( block, index ) => {
						// we need to look up validation messages here as they may be useful
						return checkParseValid( block, basename, validationIssues[ index ] );
					} );
				}

				try {
					expect( blocksActualNormalized ).toEqual( blocksExpected );
				} catch ( err ) {
					throw new Error(
						format(
							"File '%s' does not match expected value:\n\n%s",
							jsonFixtureFileName,
							err.message
						)
					);
				}

				// `serialize` doesn't have a trailing newline, but the fixture
				// files should.
				const serializedActual = serialize( blocksActual ) + '\n';
				const {
					filename: serializedHTMLFileName,
					file: serializedHTMLFixtureContent,
				} = getBlockFixtureSerializedHTML( basename );

				let serializedExpected;
				if ( serializedHTMLFixtureContent ) {
					serializedExpected = serializedHTMLFixtureContent;
				} else if ( process.env.GENERATE_MISSING_FIXTURES ) {
					serializedExpected = serializedActual;
					writeBlockFixtureSerializedHTML( basename, serializedExpected );
				} else {
					throw new Error( `Missing fixture file: ${ serializedHTMLFileName }` );
				}

				try {
					expect( serializedActual ).toEqual( serializedExpected );
				} catch ( err ) {
					throw new Error(
						format(
							"File '%s' does not match expected value:\n\n%s",
							serializedHTMLFileName,
							err.message
						)
					);
				}
			} );
		} );

		if ( primaryBlockSettings.deprecated?.length ) {
			test( 'fixture is present for each block deprecation', () => {
				const nameToFilename = blockNameToFixtureBasename( blockName );
				const errors = [];
				primaryBlockSettings.deprecated.forEach( ( deprecation, index ) => {
					if (
						deprecation &&
						! blockBasenames.includes( `${ nameToFilename }__deprecated-${ index + 1 }` )
					) {
						errors.push(
							`Expected a fixture file called '${ nameToFilename }__deprecated-${ index + 1 }.html'`
						);
					}
				} );
				try {
					expect( errors ).toHaveLength( 0 );
				} catch ( error ) {
					throw new Error( 'Problem(s) with fixture files:\n\n' + errors.join( '\n' ) );
				}
			} );
		}
	} );
}

/**
 * Convert a nested object representing blocks into just the validation messages.
 *
 * @param {Array} blocks - Blocks.
 * @returns {Array} Validation issues object.
 */
function gatherValidationIssues( blocks ) {
	return blocks.map( block => {
		const innerBlocks = block.innerBlocks ? gatherValidationIssues( block.innerBlocks ) : [];
		const validationIssues = block.validationIssues
			? block.validationIssues.map( issue =>
					sprintf(
						// eslint-disable-next-line @wordpress/i18n-no-variables
						__( issue.args[ 0 ], 'jetpack' ),
						...issue.args.slice( 1 )
					)
			  )
			: [];
		return {
			name: block.name || 'unknown',
			validationIssues,
			innerBlocks,
		};
	} );
}

/**
 * Check for valid parse.
 *
 * @param {object} block - Block.
 * @param {string} fixtureName - Fixture name.
 * @param {object|null} validationIssues - Issues object.
 * @throws {Error} If the parse was invalid.
 */
function checkParseValid( block, fixtureName, validationIssues = null ) {
	if ( ! block.isValid ) {
		// eslint-disable-next-line testing-library/render-result-naming-convention -- False positive.
		const validationIssuesString = renderValidationIssuesString( validationIssues );
		throw new Error(
			`Fixture ${ fixtureName } is invalid` +
				( validationIssuesString ? `: ${ validationIssuesString }` : '' )
		);
	}
	if ( block.innerBlocks.length > 0 ) {
		block.innerBlocks.forEach( ( innerBlock, index ) =>
			checkParseValid( innerBlock, fixtureName, validationIssues.innerBlocks[ index ] )
		);
	}
}

/**
 * Render validation issues string.
 *
 * @param {object} issues - Issues object.
 * @returns {string} Rendered string.
 */
function renderValidationIssuesString( issues ) {
	if ( ! issues ) {
		return null;
	}

	let validationIssuesString = '';
	if ( issues.validationIssues.length > 0 ) {
		validationIssuesString += issues.name + '\n    ' + issues.validationIssues.join( '\n\n    ' );
	}

	if ( issues.innerBlocks.length > 0 ) {
		validationIssuesString += issues.innerBlocks.map( renderValidationIssuesString ).join( '\n\n' );
	}

	return validationIssuesString;
}

/**
 * Register blocks.
 *
 * @param {Array} blocks - Blocks.
 */
export function registerBlocks( blocks ) {
	// Need to add a valid category or block registration fails
	setCategories( [
		{
			slug: 'test',
			title: 'Test',
		},
	] );
	blocks.forEach( block => {
		registerBlockType( block.name, { ...block.settings, category: 'test' } );
	} );
}

/**
 * Normalize parsed blocks.
 *
 * @param {Array} blocks - Blocks.
 * @returns {Array} Normalized blocks.
 */
function normalizeParsedBlocks( blocks ) {
	return blocks.map( ( block, index ) => {
		// Clone and remove React-instance-specific stuff; also, attribute
		// values that equal `undefined` will be removed. Validation issues
		// add too much noise so they get removed as well.
		block = JSON.parse( JSON.stringify( omit( block, 'validationIssues' ) ) );

		// Change client IDs to a predictable value
		block.clientId = '_clientId_' + index;

		// Recurse to normalize inner blocks
		block.innerBlocks = normalizeParsedBlocks( block.innerBlocks );

		return block;
	} );
}

/**
 * Read fixture file.
 *
 * @param {string} fixturesDir - Fixtures directory.
 * @param {string} filename - Filename.
 * @returns {string|null} Content.
 */
function readFixtureFile( fixturesDir, filename ) {
	try {
		return fs.readFileSync( path.join( fixturesDir, filename ), 'utf8' );
	} catch ( err ) {
		return null;
	}
}

/**
 * Write fixture file.
 *
 * @param {string} fixturesDir - Fixtures directory.
 * @param {string} filename - Filename.
 * @param {string} content - Content.
 */
function writeFixtureFile( fixturesDir, filename, content ) {
	fs.writeFileSync( path.join( fixturesDir, filename ), content );
}

/**
 * Set fixtures dir.
 *
 * @param {string} fixturePath - Path.
 */
function setFixturesDir( fixturePath ) {
	FIXTURES_DIR = path.join( fixturePath, 'fixtures' );
}
/**
 * Block name to fixture basename.
 *
 * @param {string} blockName - Block name.
 * @returns {string} Fixture base name.
 */
function blockNameToFixtureBasename( blockName ) {
	return blockName.replace( /\//g, '__' );
}

/**
 * Get available block fixtures basenames.
 *
 * @returns {string[]} Names.
 */
function getAvailableBlockFixturesBasenames() {
	// We expect 4 different types of files for each fixture:
	//  - fixture.html            : original content
	//  - fixture.parsed.json     : parser output
	//  - fixture.json            : blocks structure
	//  - fixture.serialized.html : re-serialized content
	// Get the "base" name for each fixture first.
	return uniq(
		fs
			.readdirSync( FIXTURES_DIR )
			.filter( f => /(\.html|\.json)$/.test( f ) )
			.map( f => f.replace( /\..+$/, '' ) )
	);
}

/**
 * Get block fixture HTML
 *
 * @param {string} basename - Filename base.
 * @returns {object} Fixture data.
 */
function getBlockFixtureHTML( basename ) {
	const filename = `${ basename }.html`;
	const fileContents = readFixtureFile( FIXTURES_DIR, filename );
	return {
		filename,
		file: fileContents ? fileContents.trim() : null,
	};
}

/**
 * Get block fixture JSON.
 *
 * @param {string} basename - Filename base.
 * @returns {object} Fixture data.
 */
function getBlockFixtureJSON( basename ) {
	const filename = `${ basename }.json`;
	return {
		filename,
		file: readFixtureFile( FIXTURES_DIR, filename ),
	};
}

/**
 * Get block fixture parsed JSON
 *
 * @param {string} basename - Filename base.
 * @returns {object} Fixture data.
 */
function getBlockFixtureParsedJSON( basename ) {
	const filename = `${ basename }.parsed.json`;
	return {
		filename,
		file: readFixtureFile( FIXTURES_DIR, filename ),
	};
}

/**
 * Get block fixture serialized HTML
 *
 * @param {string} basename - Filename base.
 * @returns {object} Fixture data.
 */
function getBlockFixtureSerializedHTML( basename ) {
	const filename = `${ basename }.serialized.html`;
	return {
		filename,
		file: readFixtureFile( FIXTURES_DIR, filename ),
	};
}

/**
 * Write block fixture JSON
 *
 * @param {string} basename - Filename base.
 * @param {string} fixture - Data to write.
 */
function writeBlockFixtureJSON( basename, fixture ) {
	writeFixtureFile( FIXTURES_DIR, `${ basename }.json`, fixture );
}

/**
 * Write block fixture parsed JSON
 *
 * @param {string} basename - Filename base.
 * @param {string} fixture - Data to write.
 */
function writeBlockFixtureParsedJSON( basename, fixture ) {
	writeFixtureFile( FIXTURES_DIR, `${ basename }.parsed.json`, fixture );
}

/**
 * Write block fixture serialized HTML
 *
 * @param {string} basename - Filename base.
 * @param {string} fixture - Data to write.
 */
function writeBlockFixtureSerializedHTML( basename, fixture ) {
	writeFixtureFile( FIXTURES_DIR, `${ basename }.serialized.html`, fixture );
}
