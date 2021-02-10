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

export default function runBlockFixtureTests( name, fixturesPath ) {
	setFixturesDir( fixturesPath );
	const basename = blockNameToFixtureBasename( name );

	describe( 'full post content fixture', () => {
		// eslint-disable-next-line jest/valid-title
		test( basename, () => {
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
			} else if ( 1 === 1 ) {
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

		test( 'should be present for each block', () => {
			const errors = [];

			const nameToFilename = blockNameToFixtureBasename( name );
			const foundFixtures = [ nameToFilename ]
				.filter(
					basename => basename === nameToFilename || startsWith( basename, nameToFilename + '__' )
				)
				.map( basename => {
					const { filename: htmlFixtureFileName } = getBlockFixtureHTML( basename );
					const { file: jsonFixtureContent } = getBlockFixtureJSON( basename );
					// The parser output for this test.  For missing files,
					// JSON.parse( null ) === null.
					const parserOutput = JSON.parse( jsonFixtureContent );
					// The name of the first block that this fixture file
					// contains (if any).
					const firstBlock = get( parserOutput, [ '0', 'name' ], null );

					return {
						filename: htmlFixtureFileName,
						parserOutput,
						firstBlock,
					};
				} )
				.filter( fixture => fixture.parserOutput !== null );

			if ( ! foundFixtures.length ) {
				errors.push(
					format(
						"Expected a fixture file called '%s.html' or '%s__*.html'.",
						nameToFilename,
						nameToFilename
					)
				);
			}

			if ( errors.length ) {
				throw new Error( 'Problem(s) with fixture files:\n\n' + errors.join( '\n' ) );
			}
		} );
	} );
}
