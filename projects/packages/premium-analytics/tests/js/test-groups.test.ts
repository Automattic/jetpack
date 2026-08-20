/**
 * External dependencies
 */
import fs from 'fs';
import path from 'path';

const GROUPS_DIR = path.join( __dirname, '..', '..', 'widgets', '__groups__' );

/**
 * Top-level `jest.mock()` calls in a source file, as raw text.
 *
 * A regex can't be trusted here — mock factories contain nested parens and
 * arbitrary JSX — so the call is delimited by balancing parentheses instead.
 *
 * @param {string} source - File contents.
 * @return {string[]} The `jest.mock( … )` calls, in source order.
 */
function mockCalls( source: string ): string[] {
	const calls: string[] = [];
	let index = 0;

	for (;;) {
		const start = source.indexOf( '\njest.mock(', index );
		if ( start < 0 ) {
			return calls;
		}

		let cursor = start + '\njest.mock'.length;
		let depth = 0;
		while ( cursor < source.length ) {
			if ( source[ cursor ] === '(' ) {
				depth++;
			} else if ( source[ cursor ] === ')' ) {
				depth--;
				if ( depth === 0 ) {
					break;
				}
			}
			cursor++;
		}

		calls.push( source.slice( start, cursor + 1 ).trim() );
		index = cursor;
	}
}

/**
 * A comparable fingerprint of everything a suite mocks.
 *
 * Members of a group share one module registry, so a mock registered by one of
 * them applies to all — grouping suites whose mocks differ silently changes what
 * the other suites are testing. Relative paths inside a factory (typically
 * `jest.requireActual( '../../test-utils' )`) are resolved first, so suites at
 * different nesting depths that mock the same module compare equal.
 *
 * @param {string} file - Absolute path of the test file.
 * @return {string[]|null} Normalised mock calls, or null when the file mocks a
 * relative specifier, which resolves per-file and so can never be shared.
 */
function mockSignature( file: string ): string[] | null {
	const signature: string[] = [];

	for ( const call of mockCalls( fs.readFileSync( file, 'utf8' ) ) ) {
		const specifier = call.match( /jest\.mock\(\s*'([^']+)'/ )?.[ 1 ];
		if ( specifier === undefined || specifier.startsWith( '.' ) ) {
			return null;
		}
		const dir = path.dirname( file );
		signature.push(
			call
				.replace( /'(\.[^']*)'/g, ( _match, relative ) => `'${ path.resolve( dir, relative ) }'` )
				.replace( /\s+/g, ' ' )
		);
	}

	return signature.sort();
}

/**
 * Group files omit the extension, matching how the suites are imported.
 *
 * @param {string} member - Extensionless absolute path from a group file.
 * @return {string|null} The real file, or null when nothing resolves.
 */
function resolveSuite( member: string ): string | null {
	return [ '.tsx', '.ts' ].map( ext => member + ext ).find( fs.existsSync ) ?? null;
}

/**
 * Lists the group definitions to check.
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
 * Reads the suites a group pulls in.
 *
 * @param {string} groupFile - Group file name.
 * @return {string[]} Absolute, extensionless paths of the suites it imports.
 */
function membersOf( groupFile: string ): string[] {
	const source = fs.readFileSync( path.join( GROUPS_DIR, groupFile ), 'utf8' );
	return [ ...source.matchAll( /^import '([^']+)';$/gm ) ].map( match =>
		path.resolve( GROUPS_DIR, match[ 1 ] )
	);
}

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
