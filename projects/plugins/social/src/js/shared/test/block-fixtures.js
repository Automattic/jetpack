/**
 * External dependencies
 */
import { omit, uniq, pick } from 'lodash';
import { format } from 'util';
import fs from 'fs';
import path from 'path';
import { __, sprintf } from '@wordpress/i18n';

/**
 * WordPress dependencies
 */
import { parse, serialize, registerBlockType, setCategories } from '@wordpress/blocks';
import { parse as grammarParse } from '@wordpress/block-serialization-default-parser';

/* eslint-disable no-console */
console.warn = jest.fn();
console.error = jest.fn();
console.info = jest.fn();
/* eslint-enable no-console */

let FIXTURES_DIR;

/* eslint-disable jest/no-export */
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

				const blocksActual = parse( htmlFixtureContent );

				// Block validation may log errors during deprecation migration,
				// unless explicitly handled from a valid block via isEligible.
				// Match on basename for deprecated blocks fixtures to allow.
				const isDeprecated = /__deprecated([-_]|$)/.test( basename );
				if ( isDeprecated ) {
					/* eslint-disable no-console */
					console.warn.mockReset();
					console.error.mockReset();
					console.info.mockReset();
					/* eslint-enable no-console */
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
						return checkParseValid( block, basename, validationIssues[index] );
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
					expect( errors.length ).toEqual( 0 );
				} catch ( error ) {
					throw new Error( 'Problem(s) with fixture files:\n\n' + errors.join( '\n' ) );
				}
			} );
		}
	} );
}

/**
 * Convert a nested object representing blocks into just the validation messages.
 */
function gatherValidationIssues( blocks ) {
	return blocks.map( block => {
		const innerBlocks = block.innerBlocks ? gatherValidationIssues( block.innerBlocks ) : [];
		const validationIssues = block.validationIssues ? block.validationIssues.map( issue => sprintf( __( issue.args[0] ), ...issue.args.slice(1) ) ) : [];
		return {
			name: block.name || 'unknown',
			validationIssues,
			innerBlocks
		}
	} );
}

/* eslint-disable jest/no-export */

function checkParseValid( block, fixtureName, validationIssues = null ) {
	if ( ! block.isValid ) {
		const validationIssuesString = renderValidationIssuesString( validationIssues );
		throw new Error( `Fixture ${ fixtureName } is invalid` + ( validationIssuesString ? `: ${validationIssuesString}` : '' ) );
	}
	if ( block.innerBlocks.length > 0 ) {
		block.innerBlocks.forEach( ( block, index ) => checkParseValid( block, fixtureName, validationIssues.innerBlocks[index] ) );
	}
}

function renderValidationIssuesString( issues ) {
	if ( ! issues ) {
		return null;
	}

	let validationIssuesString = '';
	if ( issues.validationIssues.length > 0 ) {
		validationIssuesString += issues.name + "\n    " + issues.validationIssues.join("\n\n    ");
	}

	if ( issues.innerBlocks.length > 0 ) {
		validationIssuesString += issues.innerBlocks.map( renderValidationIssuesString ).join("\n\n");
	}

	return validationIssuesString;
}

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

function readFixtureFile( fixturesDir, filename ) {
	try {
		return fs.readFileSync( path.join( fixturesDir, filename ), 'utf8' );
	} catch ( err ) {
		return null;
	}
}

function writeFixtureFile( fixturesDir, filename, content ) {
	fs.writeFileSync( path.join( fixturesDir, filename ), content );
}

function setFixturesDir( fixturePath ) {
	FIXTURES_DIR = path.join( fixturePath, 'fixtures' );
}
function blockNameToFixtureBasename( blockName ) {
	return blockName.replace( /\//g, '__' );
}

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

function getBlockFixtureHTML( basename ) {
	const filename = `${ basename }.html`;
	const fileContents = readFixtureFile( FIXTURES_DIR, filename );
	return {
		filename,
		file: fileContents ? fileContents.trim() : null,
	};
}

function getBlockFixtureJSON( basename ) {
	const filename = `${ basename }.json`;
	return {
		filename,
		file: readFixtureFile( FIXTURES_DIR, filename ),
	};
}

function getBlockFixtureParsedJSON( basename ) {
	const filename = `${ basename }.parsed.json`;
	return {
		filename,
		file: readFixtureFile( FIXTURES_DIR, filename ),
	};
}

function getBlockFixtureSerializedHTML( basename ) {
	const filename = `${ basename }.serialized.html`;
	return {
		filename,
		file: readFixtureFile( FIXTURES_DIR, filename ),
	};
}

function writeBlockFixtureJSON( basename, fixture ) {
	writeFixtureFile( FIXTURES_DIR, `${ basename }.json`, fixture );
}

function writeBlockFixtureParsedJSON( basename, fixture ) {
	writeFixtureFile( FIXTURES_DIR, `${ basename }.parsed.json`, fixture );
}

function writeBlockFixtureSerializedHTML( basename, fixture ) {
	writeFixtureFile( FIXTURES_DIR, `${ basename }.serialized.html`, fixture );
}
