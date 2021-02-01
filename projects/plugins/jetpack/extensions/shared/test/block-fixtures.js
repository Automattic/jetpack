/**
 * External dependencies
 */
import { omit, startsWith, get } from 'lodash';
import { format } from 'util';

/**
 * WordPress dependencies
 */
import { parse, serialize } from '@wordpress/blocks';
import { parse as grammarParse } from '@wordpress/block-serialization-default-parser';

/**
 * Internal dependencies
 */
import {
	getAvailableBlockFixturesBasenames,
	blockNameToFixtureBasename,
	getBlockFixtureHTML,
	getBlockFixtureJSON,
	getBlockFixtureParsedJSON,
	getBlockFixtureSerializedHTML,
	writeBlockFixtureParsedJSON,
	writeBlockFixtureJSON,
	writeBlockFixtureSerializedHTML,
	setFixturesDir,
} from './block-fixture-utils';

/* eslint-disable no-console */
console.warn = jest.fn();
console.error = jest.fn();
console.info = jest.fn();
/* eslint-enable no-console */

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

export default function runBlockFixtureTests( blockName, settings, fixturesPath ) {
	setFixturesDir( fixturesPath );
	const blockBasenames = getAvailableBlockFixturesBasenames();

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

				const blocksActualNormalized = normalizeParsedBlocks( blocksActual );
				const { filename: jsonFixtureFileName, file: jsonFixtureContent } = getBlockFixtureJSON(
					basename
				);

				let blocksExpectedString;

				if ( jsonFixtureContent ) {
					blocksExpectedString = jsonFixtureContent;
				} else if ( process.env.GENERATE_MISSING_FIXTURES ) {
					blocksExpectedString = JSON.stringify( blocksActualNormalized, null, 4 ) + '\n';
					writeBlockFixtureJSON( basename, blocksExpectedString );
				} else {
					throw new Error( `Missing fixture file: ${ jsonFixtureFileName }` );
				}

				const blocksExpected = JSON.parse( blocksExpectedString );
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

		if ( settings.deprecated?.length ) {
			test( 'fixture is present for each block deprecation', () => {
				const nameToFilename = blockNameToFixtureBasename( blockName );
				const errors = [];
				settings.deprecated.forEach( ( deprecation, index ) => {
					if (
						deprecation &&
						! blockBasenames.includes( `${ nameToFilename }__deprecated-${ index + 1 }` )
					) {
						errors.push(
							`Expected a fixture file called '${ nameToFilename }__deprecated-${ index + 1 }.html'`
						);
					}
				} );
				if ( errors.length ) {
					throw new Error( 'Problem(s) with fixture files:\n\n' + errors.join( '\n' ) );
				}
			} );
		}
	} );
}
