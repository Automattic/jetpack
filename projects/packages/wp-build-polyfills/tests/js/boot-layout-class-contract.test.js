/**
 * Pins the Boot layout class names our stylesheets select on.
 *
 * `admin-page-layout.scss` stops its flex chain at Boot's stage, and the Forms
 * single-response print styles unwind Boot's stage and surfaces. Neither can be
 * expressed without naming Boot's internal classes, which Boot documents as
 * private — so a rename is a silent, total failure: a dead class inside
 * `:not(:has())` makes the guard permanently true and the rule it guards starts
 * applying everywhere. That is exactly how the 0.20 → 0.21 bump
 * (WordPress/gutenberg#81756, plain classes → CSS Modules) shipped a stacked
 * dashboard sidebar with nothing failing.
 *
 * Boot bakes its CSS Modules hashes in at publish time, so the class is a
 * literal in the installed package and readable without a build.
 */

const assert = require( 'node:assert/strict' );
const { readFileSync } = require( 'node:fs' );
const path = require( 'node:path' );
const { describe, it } = require( 'node:test' );

// Local name => the file that renders an element carrying it.
const RENDERED_CLASSES = {
	stage: 'components/app/router.mjs',
	inspector: 'components/app/router.mjs',
	layout: 'components/root/single-page.mjs',
	surfaces: 'components/root/single-page.mjs',
};

const bootBuildDir = () =>
	path.join( path.dirname( require.resolve( '@wordpress/boot/package.json' ) ), 'build-module' );

/**
 * Class tokens ending in the given CSS Modules local name.
 *
 * Matches both shapes the guard supports: Boot's pre-0.21 `boot-layout__stage`
 * and the hashed `d12c9efe707e6cb3__stage`.
 *
 * @param {string} source - File contents to scan.
 * @param {string} local  - CSS Modules local name, e.g. `stage`.
 * @return {string[]} Matching class tokens.
 */
function classTokens( source, local ) {
	const pattern = new RegExp( `[A-Za-z0-9_-]*__${ local }(?![A-Za-z0-9_-])`, 'g' );
	return [ ...new Set( source.match( pattern ) || [] ) ];
}

describe( 'boot layout class contract', () => {
	for ( const [ local, file ] of Object.entries( RENDERED_CLASSES ) ) {
		it( `still renders a class ending in __${ local }`, () => {
			const source = readFileSync( path.join( bootBuildDir(), file ), 'utf8' );
			const tokens = classTokens( source, local );

			assert.ok(
				tokens.length > 0,
				`@wordpress/boot no longer renders a "${ local }" class in ${ file }. ` +
					'Update the selectors in js-packages/base-styles/admin-page-layout.scss ' +
					'and packages/forms/routes/response/style.scss to match, then update this test.'
			);
		} );
	}

	it( 'keeps the stage class matching the selector base-styles ships', () => {
		const source = readFileSync( path.join( bootBuildDir(), RENDERED_CLASSES.stage ), 'utf8' );
		const [ stage ] = classTokens( source, 'stage' );

		// `[class*="__stage"]` in admin-page-layout.scss. Asserted as the
		// substring test the stylesheet actually performs, not as an equality
		// check against a hash that legitimately changes every Boot release.
		assert.ok(
			stage.includes( '__stage' ),
			`Boot's stage class "${ stage }" no longer contains "__stage".`
		);
	} );
} );
