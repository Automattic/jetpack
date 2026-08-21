import { globSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import dsTokenFallbacks from '@wordpress/theme/postcss-plugins/postcss-ds-token-fallbacks';

const SOURCE = join( __dirname, '..', '..' );

// @wordpress/theme publishes its token map only through this plugin. The `Declaration`
// visitor rewrites a declaration's `value` in place and reads nothing else off the node,
// so a synthetic node is enough to ask it what a token is worth. It throws on a token the
// installed design system does not define, which is how a rename surfaces here.
const { Declaration: rewriteValue } = dsTokenFallbacks() as {
	Declaration: ( declaration: { value: string } ) => void;
};

const normalize = ( value: string ): string => value.replace( /\s+/g, ' ' ).trim();

/**
 * Reports the fallback expression the installed design system defines for a token.
 *
 * @param token - A `--wpds-*` custom property name.
 * @return The design system's value for it.
 */
function specFallback( token: string ): string {
	const declaration = { value: `var(${ token })` };
	rewriteValue( declaration );

	return declaration.value.slice( `var(${ token }, `.length, -1 );
}

type Reference = {
	file: string;
	token: string;
	/** The written fallback, or null where the reference is bare. */
	fallback: string | null;
};

/**
 * Finds every `--wpds-*` reference in a file. Scanning for the closing parenthesis by depth, rather than matching a regex, keeps a fallback that is itself a function call or a nested `var()` intact — `cubic-bezier(0.15, 0, 0.15, 1)` and `var(--wp-admin-theme-color, #3858e9)` both end at a parenthesis an inner call opened.
 *
 * @param source - The file's contents.
 * @param file   - Its path, relative to `src`.
 * @return Every reference the file makes.
 */
function referencesIn( source: string, file: string ): Reference[] {
	const opener = /var\(\s*(--wpds-[\w-]+)\s*/g;
	const references: Reference[] = [];
	let match;

	while ( ( match = opener.exec( source ) ) !== null ) {
		const token = match[ 1 ];

		if ( source[ opener.lastIndex ] !== ',' ) {
			references.push( { file, token, fallback: null } );
			continue;
		}

		let index = opener.lastIndex + 1;
		let depth = 1;

		while ( index < source.length && depth > 0 ) {
			if ( source[ index ] === '(' ) {
				depth++;
			} else if ( source[ index ] === ')' ) {
				depth--;
			}

			if ( depth > 0 ) {
				index++;
			}
		}

		references.push( {
			file,
			token,
			fallback: normalize( source.slice( opener.lastIndex + 1, index ) ),
		} );
	}

	return references;
}

const references = globSync( '**/*.{scss,css,ts,tsx,mdx}', { cwd: SOURCE } )
	.filter( file => ! file.includes( '/test/' ) )
	.flatMap( file => referencesIn( readFileSync( join( SOURCE, file ), 'utf8' ), file ) );

describe( 'design token references', () => {
	it( 'finds the references, so a broken scan cannot pass as a clean one', () => {
		expect( references.length ).toBeGreaterThan( 30 );
	} );

	// Every fallback here is hand-written, because both of this package's consumption paths
	// have to carry it: `@wordpress/build` apps read `dist/`, while webpack apps resolve the
	// SCSS through the `jetpack:src` export condition and compile it themselves. Neither
	// build injects fallbacks, so a bare reference in a stylesheet renders as nothing at all
	// in a host that has not loaded the design-system stylesheet — and WordPress ships none.
	//
	// A bare reference in TS can be deliberate: `stories/theme-config.tsx` seeds a series
	// colour from a token `ThemeProvider` generates, where resolving to nothing is the
	// wanted behaviour when no provider is above the chart.
	it( 'writes a fallback for every token a stylesheet reads', () => {
		expect(
			references.filter(
				reference => reference.fallback === null && /\.(scss|css)$/.test( reference.file )
			)
		).toEqual( [] );
	} );

	// This is the check that keeps a hand-written value honest. It is what `499` — a font
	// weight that was spec once and drifted — needed and did not have.
	it( 'writes the design system value as that fallback', () => {
		const drifted = references.filter(
			reference =>
				reference.fallback !== null &&
				reference.fallback !== normalize( specFallback( reference.token ) )
		);

		expect(
			drifted.map( ( { file, token, fallback } ) => ( {
				file,
				token,
				fallback,
				spec: normalize( specFallback( token ) ),
			} ) )
		).toEqual( [] );
	} );
} );
