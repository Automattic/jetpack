/**
 * External dependencies
 */
import fs from 'fs';
import path from 'path';
import * as ts from 'typescript';

const GROUPS_DIR = path.join( __dirname, '..', '..', 'widgets', '__groups__' );

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
 * Resolves an extensionless suite path.
 *
 * @param {string} member - Extensionless suite path.
 * @return {string|null} The real file, or null when nothing resolves.
 */
function resolveSuite( member: string ): string | null {
	return [ '.tsx', '.ts' ].map( ext => member + ext ).find( fs.existsSync ) ?? null;
}

/**
 * Gets group file names.
 *
 * @return {string[]} Group file names, sorted for stable test titles.
 */
function groupFiles(): string[] {
	return fs
		.readdirSync( GROUPS_DIR )
		.filter( name => name.endsWith( '.test.tsx' ) )
		.sort();
}

/**
 * Gets suites imported by a group.
 *
 * @param {string} groupFile - Group file name.
 * @return {string[]} Suites imported by the group.
 */
function membersOf( groupFile: string ): string[] {
	const source = fs.readFileSync( path.join( GROUPS_DIR, groupFile ), 'utf8' );
	return [ ...source.matchAll( /^import '([^']+)';$/gm ) ].map( match =>
		path.resolve( GROUPS_DIR, match[ 1 ] )
	);
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

describe( 'widget test groups', () => {
	const groups = groupFiles();

	it( 'has at least one group to check', () => {
		expect( groups.length ).toBeGreaterThan( 0 );
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
