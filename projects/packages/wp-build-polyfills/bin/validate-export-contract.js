#!/usr/bin/env node

/**
 * Validate that symbols one polyfilled package imports from another actually
 * exist in the shipped version's public API.
 *
 * This package ships a matched set of `@wordpress/*` packages. When they get
 * out of version sync, a symbol one imports from another (e.g.
 * `ThemeProvider` from `@wordpress/theme`) can resolve to `undefined` at
 * runtime — a blank dashboard with NO build error. That is the Jetpack 16.0
 * failure mode. The handle-name check in `validate-boot-asset.js` does not
 * catch it; this one does.
 *
 * Runs after the build (see package.json `build`), and is also exercised by
 * `tests/js/validate-export-contract.test.js`.
 *
 * Manual trigger (simulate a skew without touching the lockfile): set
 * `WP_BUILD_POLYFILLS_SIMULATE_MISSING="@wordpress/theme:ThemeProvider"` and run this script,
 * or use the `pnpm run simulate:skew` shortcut.
 */

const { validateExportContracts } = require( './validate-export-contract-lib.js' );

const result = validateExportContracts();

if ( ! result.ok ) {
	throw new Error( result.error );
}
