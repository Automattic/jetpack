// The page's `h1` comes from the `<Page>` chassis in `<DashboardLayout>`.
// Every screen and card renders inside that, so every first in-body heading
// is an `h2` — the outline used to jump h1 → h3, skipping a level on every
// screen. The one exception is the error boundary, which replaces the whole
// layout including the chassis, so its heading really is the document's
// first.
//
// Asserted from the source rather than by rendering: eleven components
// across four route bundles, each with its own mocking requirements, and
// what is being pinned is a property of the tree as a whole rather than of
// any one screen.

import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const DASHBOARD = join( __dirname, '..', 'src', 'dashboard' );

/** The one component that renders instead of the chassis, not inside it. */
const REPLACES_THE_CHASSIS = 'components/error-boundary/index.tsx';

/**
 * Components that render inside another card rather than directly under the
 * chassis, and so legitimately start deeper than `h2`.
 *
 * Keyed to the parent they nest under, which is what makes "one level down"
 * checkable rather than asserted.
 */
const NESTED_UNDER: Record< string, string > = {
	'components/file-info-card/index.tsx': 'components/backup-detail/index.tsx',
};

/**
 * Every `.tsx` under `src/dashboard`, relative to that directory.
 *
 * @param dir - Directory to walk.
 * @return Relative paths, POSIX-separated.
 */
function tsxFiles( dir: string ): string[] {
	return readdirSync( dir ).flatMap( entry => {
		const full = join( dir, entry );
		if ( statSync( full ).isDirectory() ) {
			return tsxFiles( full );
		}
		return entry.endsWith( '.tsx' )
			? [
					full
						.slice( DASHBOARD.length + 1 )
						.split( '\\' )
						.join( '/' ),
			  ]
			: [];
	} );
}

/**
 * Every `.scss` under `src/dashboard`, relative to that directory.
 *
 * @param dir - Directory to walk.
 * @return Relative paths, POSIX-separated.
 */
function scssFiles( dir: string ): string[] {
	return readdirSync( dir ).flatMap( entry => {
		const full = join( dir, entry );
		if ( statSync( full ).isDirectory() ) {
			return scssFiles( full );
		}
		return entry.endsWith( '.scss' )
			? [
					full
						.slice( DASHBOARD.length + 1 )
						.split( '\\' )
						.join( '/' ),
			  ]
			: [];
	} );
}

/**
 * The heading levels a file renders, in source order.
 *
 * Matches the `render={ <hN … /> }` form this package uses to give a
 * `<Text>` its semantics.
 *
 * @param relative - Path relative to `src/dashboard`.
 * @return The levels found, as numbers.
 */
function headingLevels( relative: string ): number[] {
	const source = readFileSync( join( DASHBOARD, relative ), 'utf8' );
	return Array.from( source.matchAll( /render=\{ <h([1-6])/g ) ).map( m => Number( m[ 1 ] ) );
}

describe( 'the dashboard heading outline', () => {
	// The premise. If this ever finds nothing the rest passes vacuously.
	it( 'finds headings to check', () => {
		const withHeadings = tsxFiles( DASHBOARD ).filter( f => headingLevels( f ).length > 0 );

		expect( withHeadings.length ).toBeGreaterThanOrEqual( 11 );
	} );

	it( 'starts every top-level in-layout component at h2, never h3', () => {
		const offenders = tsxFiles( DASHBOARD )
			.filter( f => f !== REPLACES_THE_CHASSIS && ! NESTED_UNDER[ f ] )
			.map( f => ( { file: f, first: headingLevels( f )[ 0 ] } ) )
			.filter( ( { first } ) => first !== undefined && first !== 2 );

		expect( offenders ).toEqual( [] );
	} );

	// The error boundary is `h1` on purpose: when it renders, the chassis
	// `h1` is gone and this is the document's only heading.
	it( 'keeps the error boundary at h1', () => {
		expect( headingLevels( REPLACES_THE_CHASSIS ) ).toEqual( [ 1 ] );
	} );

	// A nested card goes exactly one level deeper than the card it sits in —
	// deeper is allowed, skipping is not.
	it( 'puts each nested card one level under its parent', () => {
		const wrong = Object.entries( NESTED_UNDER )
			.map( ( [ child, parent ] ) => ( {
				child,
				childLevel: headingLevels( child )[ 0 ],
				parentLevel: headingLevels( parent )[ 0 ],
			} ) )
			.filter( ( { childLevel, parentLevel } ) => childLevel !== parentLevel + 1 );

		expect( wrong ).toEqual( [] );
	} );

	// Changing a level silently orphans any CSS that selected the old tag.
	// That is not hypothetical: `.jpb-storage-space h3 { margin-block: 0 12px }`
	// stopped matching when this outline was corrected, `@wordpress/ui`'s
	// `:is(h1,…,h6).heading` default supplied `margin: 0`, and the section
	// lost 12px of its height — while the loading placeholder went on
	// reserving the gap, so it started jumping on load. jsdom does not apply
	// the built stylesheet, so no render test can catch it; reading the SCSS
	// can.
	it( 'never selects a heading by tag name in SCSS', () => {
		const offenders = scssFiles( DASHBOARD ).flatMap( file =>
			readFileSync( join( DASHBOARD, file ), 'utf8' )
				.split( '\n' )
				.map( ( line, i ) => ( { file, line: i + 1, text: line.trim() } ) )
				.filter( ( { text } ) => /^&?\s*h[1-6]\s*(,|\{)/.test( text ) )
		);

		expect( offenders ).toEqual( [] );
	} );

	it( 'never skips a level within a single component', () => {
		const skips = tsxFiles( DASHBOARD )
			.map( f => ( { file: f, levels: headingLevels( f ) } ) )
			.filter( ( { levels } ) => levels.some( ( l, i ) => i > 0 && l - levels[ i - 1 ] > 1 ) );

		expect( skips ).toEqual( [] );
	} );
} );
