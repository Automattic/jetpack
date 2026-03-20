#!/usr/bin/env node

/**
 * Validate the boot module's asset file to catch unregistered script handles.
 *
 * The boot module polyfill lists classic script handles as dependencies in its
 * .asset.php file. WordPress silently skips printing scripts when a dependency
 * handle isn't registered, causing a blank page with no errors.
 *
 * This script checks that every handle in the asset file is either:
 * - A well-known WordPress Core script handle
 * - A handle polyfilled by this package (SCRIPT_HANDLES in class-wp-build-polyfills.php)
 * - A vendor handle (react, react-dom, etc.)
 *
 * Run this after the build to catch issues before they reach production.
 */

const { validateBootAsset } = require( './validate-boot-asset-lib.js' );

const result = validateBootAsset();

if ( ! result.ok ) {
	throw new Error( result.error );
}
