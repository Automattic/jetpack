/**
 * External dependencies
 */
import fs from 'fs';
import path from 'path';
import * as ts from 'typescript';
/**
 * Internal dependencies
 */
import {
	GROUPS_DIR,
	groupFileNames,
	parseGroupSource,
	readGroup,
	resolveSuite,
	strayGroupDirEntries,
} from '../group-members.cjs';

/**
 * Gets top-level `jest.mock()` calls from a source file.
 *
 * @param {string} source - File contents.
 * @return {{ calls: ts.CallExpression[], sourceFile: ts.SourceFile }} Parsed source and mock calls.
 */
function mockCalls( source: string ): { calls: ts.CallExpression[]; sourceFile: ts.SourceFile } {
	const sourceFile = ts.createSourceFile(
		'test.tsx',
		source,
		ts.ScriptTarget.Latest,
		false,
		ts.ScriptKind.TSX
	);
	const calls = sourceFile.statements.flatMap( statement => {
		if (
			! ts.isExpressionStatement( statement ) ||
			! ts.isCallExpression( statement.expression )
		) {
			return [];
		}

		const call = statement.expression;
		const callee = call.expression;
		if (
			! ts.isPropertyAccessExpression( callee ) ||
			! ts.isIdentifier( callee.expression ) ||
			callee.expression.text !== 'jest' ||
			callee.name.text !== 'mock'
		) {
			return [];
		}

		return [ call ];
	} );

	return { calls, sourceFile };
}

/**
 * Prints a mock call after resolving relative strings in its factory.
 *
 * @param {ts.CallExpression} call       - Mock call to normalize.
 * @param {ts.SourceFile}     sourceFile - Parsed source containing the call.
 * @param {string}            directory  - Directory of the test file.
 * @return {string} Canonical mock call.
 */
function normalizeMockCall(
	call: ts.CallExpression,
	sourceFile: ts.SourceFile,
	directory: string
): string {
	const transformer: ts.TransformerFactory< ts.CallExpression > = context => root => {
		const visitor: ts.Visitor = node => {
			if ( ts.isStringLiteral( node ) && node.text.startsWith( '.' ) ) {
				return context.factory.createStringLiteral( path.resolve( directory, node.text ) );
			}
			return ts.visitEachChild( node, visitor, context );
		};

		return ts.visitNode( root, visitor ) as ts.CallExpression;
	};
	const result = ts.transform( call, [ transformer ] );

	try {
		return ts
			.createPrinter( { removeComments: true } )
			.printNode( ts.EmitHint.Expression, result.transformed[ 0 ], sourceFile );
	} finally {
		result.dispose();
	}
}

/**
 * Gets a normalized signature of a suite's module mocks.
 *
 * @param {string} source - File contents.
 * @param {string} file   - Absolute path of the test file.
 * @return {string[]|null} Normalised mock calls, or null when the file mocks a
 * relative specifier, which resolves per-file and so can never be shared.
 */
function mockSignatureFromSource( source: string, file: string ): string[] | null {
	const signature: string[] = [];
	const { calls, sourceFile } = mockCalls( source );

	for ( const call of calls ) {
		const specifier = call.arguments[ 0 ];
		if ( ! specifier || ! ts.isStringLiteral( specifier ) || specifier.text.startsWith( '.' ) ) {
			return null;
		}
		signature.push( normalizeMockCall( call, sourceFile, path.dirname( file ) ) );
	}

	return signature.sort();
}

/**
 * Gets a normalized signature for the mocks in a test file.
 *
 * @param {string} file - Test file to read.
 * @return {string[]|null} Normalized module mocks.
 */
function mockSignature( file: string ): string[] | null {
	return mockSignatureFromSource( fs.readFileSync( file, 'utf8' ), file );
}

/**
 * Gets suites imported by a group.
 *
 * @param {string} groupFile - Group file name.
 * @return {string[]} Absolute extensionless paths of the suites the group lists.
 */
function membersOf( groupFile: string ): string[] {
	return readGroup( groupFile ).members;
}

describe( 'mock signature parser', () => {
	it( 'compares complete factories when comments and strings contain parentheses', () => {
		const first = `jest.mock( 'example', () => {
			// A closing parenthesis used to stop the hand-written parser here: )
			return 'first ) value';
		} );`;
		const second = first.replace( 'first ) value', 'second ) value' );

		expect( mockSignatureFromSource( first, '/widgets/first.test.tsx' ) ).not.toEqual(
			mockSignatureFromSource( second, '/widgets/second.test.tsx' )
		);
	} );
} );

describe( 'group file parser', () => {
	it( 'reads the import lines a group file is made of', () => {
		expect(
			parseGroupSource( "// A note.\n\nimport '../clicks/__tests__/clicks.test';\n" )
		).toEqual( { specifiers: [ '../clicks/__tests__/clicks.test' ], unreadable: [] } );
	} );

	it( 'reports a line it cannot read rather than skipping it', () => {
		const source = [
			"import '../clicks/__tests__/clicks.test'; // grouped",
			'import "../emails/__tests__/emails.test";',
			"\timport '../referrers/__tests__/referrers.test';",
		].join( '\n' );

		expect( parseGroupSource( source ) ).toEqual( {
			specifiers: [],
			unreadable: [
				"import '../clicks/__tests__/clicks.test'; // grouped",
				'import "../emails/__tests__/emails.test";',
				"import '../referrers/__tests__/referrers.test';",
			],
		} );
	} );
} );

describe( 'widget test groups', () => {
	const groups = groupFileNames();

	it( 'has at least one group to check', () => {
		expect( groups.length ).toBeGreaterThan( 0 );
	} );

	// The Jest config keeps a member out of the ungrouped run by matching the
	// same import lines this test reads. Anything either side cannot read is
	// left running twice — standalone and inside its group — with nothing here
	// checking it, so a group file carries imports and comments and nothing else.
	it.each( groups )( '%s carries nothing but member imports', groupFile => {
		expect( readGroup( groupFile ).unreadable ).toEqual( [] );
	} );

	it( 'holds no file that neither the config nor this test reads', () => {
		expect( strayGroupDirEntries() ).toEqual( [] );
	} );

	it.each( groups )( '%s only lists suites that exist', groupFile => {
		const missing = membersOf( groupFile ).filter( member => resolveSuite( member ) === null );
		expect( missing ).toEqual( [] );
	} );

	it.each( groups )( '%s members declare identical module mocks', groupFile => {
		const signatures = membersOf( groupFile ).map( member => ( {
			member: path.relative( GROUPS_DIR, member ),
			signature: mockSignature( resolveSuite( member ) as string ),
		} ) );

		// A relative specifier resolves against the mocking file, so two suites
		// using the same text mock different modules. Such a suite runs alone.
		expect( signatures.filter( entry => entry.signature === null ).map( e => e.member ) ).toEqual(
			[]
		);

		const [ first, ...rest ] = signatures;
		for ( const entry of rest ) {
			expect( { member: entry.member, signature: entry.signature } ).toEqual( {
				member: entry.member,
				signature: first.signature,
			} );
		}
	} );

	it( 'never lists the same suite in two groups', () => {
		const seen = new Map< string, string >();
		const duplicates: string[] = [];

		for ( const groupFile of groups ) {
			for ( const member of membersOf( groupFile ) ) {
				const previous = seen.get( member );
				if ( previous ) {
					duplicates.push(
						`${ path.relative( GROUPS_DIR, member ) }: ${ previous }, ${ groupFile }`
					);
				}
				seen.set( member, groupFile );
			}
		}

		expect( duplicates ).toEqual( [] );
	} );
} );
