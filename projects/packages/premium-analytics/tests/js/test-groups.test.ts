/**
 * External dependencies
 */
import fs from 'fs';
import path from 'path';

const GROUPS_DIR = path.join( __dirname, '..', '..', 'widgets', '__groups__' );

/**
 * Gets top-level `jest.mock()` calls by balancing their parentheses.
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
 * Gets a normalized signature of a suite's module mocks.
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
