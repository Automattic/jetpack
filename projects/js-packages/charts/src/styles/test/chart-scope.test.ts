import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const stylesheet = readFileSync( join( __dirname, '..', 'chart-scope.scss' ), 'utf8' );
const tokensDoc = readFileSync( join( __dirname, '..', '..', '..', 'TOKENS.md' ), 'utf8' );

type Entry = {
	/** The custom property this one reads, or null when the value is a literal. */
	reads: string | null;
	/** The `var()` fallback, or the whole value when it reads nothing. */
	fallback: string | null;
};

const normalize = ( value: string ): string => value.replace( /\s+/g, ' ' ).trim();

/**
 * Splits a declaration block on both newlines and semicolons, so a layout-affecting property appended after a custom property on the same line is inspected separately rather than being hidden inside a single trusted-looking line.
 *
 * @param body - The declaration block, without the surrounding `{ }`.
 * @return The property name (text before `:`) of each declaration.
 */
function extractDeclaredProperties( body: string ): string[] {
	return body
		.split( '\n' )
		.map( line => line.trim() )
		.filter( line => line && ! line.startsWith( '//' ) )
		.join( '\n' )
		.split( ';' )
		.map( declaration => declaration.trim() )
		.filter( declaration => declaration.length > 0 )
		.map( declaration => declaration.slice( 0, declaration.indexOf( ':' ) ).trim() );
}

/**
 * Parses each catalog declaration in the stylesheet into the property it reads and the fallback it carries. Splitting the `var()` arguments at the *first* comma keeps a fallback that is itself a function call intact — `cubic-bezier(0.25, 0, 0, 1)` would otherwise be truncated at its first argument.
 *
 * @return Every declared `--a8c-charts-*` property, keyed by name.
 */
function parseStylesheet(): Map< string, Entry > {
	const body = stylesheet.slice( stylesheet.indexOf( '{' ) + 1, stylesheet.lastIndexOf( '}' ) );
	const entries = new Map< string, Entry >();

	for ( const declaration of body
		.split( '\n' )
		.map( line => line.trim() )
		.filter( line => line && ! line.startsWith( '//' ) )
		.join( '\n' )
		.split( ';' ) ) {
		const separator = declaration.indexOf( ':' );

		if ( separator === -1 ) {
			continue;
		}

		const name = declaration.slice( 0, separator ).trim();
		const value = normalize( declaration.slice( separator + 1 ) );
		const wrapped = /^var\(\s*(.*)\)$/s.exec( value );

		if ( ! wrapped ) {
			entries.set( name, { reads: null, fallback: value } );
			continue;
		}

		const args = wrapped[ 1 ];
		const comma = args.indexOf( ',' );

		entries.set(
			name,
			comma === -1
				? { reads: args.trim(), fallback: null }
				: { reads: args.slice( 0, comma ).trim(), fallback: normalize( args.slice( comma + 1 ) ) }
		);
	}

	return entries;
}

/**
 * Parses the catalog tables in `TOKENS.md` — the ones whose header is `Role | Maps to …` — into the same shape as the stylesheet, so the two can be compared directly. Other tables in the document (theme-field mappings, deprecated aliases) are skipped.
 *
 * @return Every documented role, keyed by name.
 */
function parseTokensDoc(): Map< string, Entry > {
	const entries = new Map< string, Entry >();
	const lines = tokensDoc.split( '\n' );
	let inCatalogTable = false;

	for ( const line of lines ) {
		if ( ! line.trim().startsWith( '|' ) ) {
			inCatalogTable = false;
			continue;
		}

		const cells = line
			.split( '|' )
			.slice( 1, -1 )
			.map( cell => cell.trim() );

		if ( cells[ 0 ] === 'Role' ) {
			inCatalogTable = cells[ 1 ]?.startsWith( 'Maps to' ) ?? false;
			continue;
		}

		if ( ! inCatalogTable || cells.length !== 3 || /^-+$/.test( cells[ 0 ] ) ) {
			continue;
		}

		const [ role, mapping, fallback ] = cells.map( cell => cell.replace( /`/g, '' ) );
		// A "none" cell explains *why* there is no mapping, and that explanation can
		// name a `--wpds-*` token itself (the removed elevation group). Read it as
		// "no mapping" before looking for a token name inside it.
		const unmapped = mapping.startsWith( '_(none' );
		const derives = /derives from (--[\w-]+)/.exec( mapping );
		const wpds = /(--wpds-[\w-]+)/.exec( mapping );

		entries.set( role, {
			reads: unmapped ? null : derives?.[ 1 ] ?? wpds?.[ 1 ] ?? null,
			fallback: fallback === '—' ? null : normalize( fallback ),
		} );
	}

	return entries;
}

const declared = parseStylesheet();
const documented = parseTokensDoc();

describe( 'chart scope catalog', () => {
	it( 'documents every declared role, and declares every documented one', () => {
		expect( [ ...documented.keys() ].sort() ).toEqual( [ ...declared.keys() ].sort() );
	} );

	// The tables in TOKENS.md restate the stylesheet for consumers who only have the
	// published package. This is the check that stops the two drifting apart.
	it.each( [ ...declared.keys() ] )( 'documents %s with the value it is declared with', token => {
		expect( documented.get( token ) ).toEqual( declared.get( token ) );
	} );

	it( 'scopes the catalog to :where(.a8c-charts-scope) rather than :root', () => {
		expect( stylesheet ).toMatch( /:where\(\.a8c-charts-scope\)\s*{/ );
		expect( stylesheet ).not.toMatch( /(^|\s):root\s*{/ );
	} );

	it( 'declares custom properties only, so this stylesheet cannot change layout', () => {
		const body = stylesheet.slice( stylesheet.indexOf( '{' ) + 1, stylesheet.lastIndexOf( '}' ) );
		const properties = extractDeclaredProperties( body );

		expect( properties.every( property => property.startsWith( '--a8c-charts-' ) ) ).toBe( true );
	} );

	it( 'rejects a layout declaration appended after a custom property on the same line', () => {
		const fixture =
			'--a8c-charts-color-grid: var(--wpds-color-stroke-surface-neutral, #dbdbdb); display: block;';
		const properties = extractDeclaredProperties( fixture );

		expect( properties.every( property => property.startsWith( '--a8c-charts-' ) ) ).toBe( false );
	} );
} );
