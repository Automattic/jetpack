// Every wp-build route must pull in the dashboard's admin shell.
//
// Each route is its own bundle and its SCSS is inlined into its own
// `content.js`, so a route that does not include the shell gets *none*
// of it — not the `jetpack-admin-page-layout-wp-build` mixin that pins
// `#wpbody-content` to the viewport, and not the page-internal
// header / body / footer flex chain.
//
// That is not a theoretical gap. The mixin lived only in the dashboard
// route, so cold-loading `/restore/$id` or `/download/$id` left
// `#wpbody-content` static and the footer wherever the content happened
// to end — measured live at 168px above the viewport bottom on the
// restore form, against the correct 8px page inset on the overview.
//
// This is a structural check rather than a layout one: jsdom does no
// layout, so the only honest automated guard is that each route asks
// for the shell. Confirming it *works* means measuring in a browser.

import { readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';

const ROUTES_DIR = join( __dirname, '..', 'routes' );

const routes = readdirSync( ROUTES_DIR ).filter( entry =>
	statSync( join( ROUTES_DIR, entry ) ).isDirectory()
);

it( 'has routes to check', () => {
	// Guards the guard: a bad path would otherwise make `it.each` below
	// vacuous and the suite would pass having asserted nothing.
	expect( routes.length ).toBeGreaterThan( 0 );
} );

describe.each( routes )( 'routes/%s', route => {
	it( 'includes the shared admin shell in its stylesheet', () => {
		const style = readFileSync( join( ROUTES_DIR, route, 'style.scss' ), 'utf8' );

		expect( style ).toMatch( /@include\s+backup-admin-shell\b/ );
	} );
} );
