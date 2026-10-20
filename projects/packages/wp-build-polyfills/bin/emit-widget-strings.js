#!/usr/bin/env node
/* global process */

/**
 * Thin wrapper around the emit-widget-strings library. Run from a package
 * directory, it writes `build/widgets/widget-strings.php`: one `_x()` per
 * translatable `widget.json` value, so gettext extraction sees the metadata
 * the widget registry translates at hydration.
 *
 * Flags: `--domain` (default: composer.json `extra.textdomain`) for widgets
 * that declare no `textdomain`; `--schema` (default: `src/widget-i18n.json`),
 * the i18n schema the registry uses; `--widgets` (default: `widgets`); `--out`
 * (default: `build/widgets/widget-strings.php`).
 *
 * See `emit-widget-strings-lib.js` for context and behaviour details.
 */

const fs = require( 'fs' );
const path = require( 'path' );
const { emitWidgetStrings } = require( './emit-widget-strings-lib.js' );
const { resolveTextdomain } = require( './package-textdomain-lib.js' );

const args = process.argv.slice( 2 );
const getFlag = name => {
	const i = args.indexOf( `--${ name }` );
	return i >= 0 ? args[ i + 1 ] : undefined;
};

const domain = resolveTextdomain( getFlag( 'domain' ), 'emit-widget-strings' );
const schemaFile = path.resolve( getFlag( 'schema' ) || path.join( 'src', 'widget-i18n.json' ) );
if ( ! fs.existsSync( schemaFile ) ) {
	throw new Error( `emit-widget-strings: no i18n schema at ${ schemaFile }. Pass --schema.` );
}
const schema = JSON.parse( fs.readFileSync( schemaFile, 'utf8' ) );
const widgetsDir = path.resolve( getFlag( 'widgets' ) || 'widgets' );
const outFile = path.resolve(
	getFlag( 'out' ) || path.join( 'build', 'widgets', 'widget-strings.php' )
);

const { entries, widgets, written } = emitWidgetStrings( { widgetsDir, schema, domain, outFile } );
// eslint-disable-next-line no-console
console.log(
	written
		? `emit-widget-strings: wrote ${ entries } string(s) from ${ widgets } widget.json file(s) to ${ outFile }`
		: `emit-widget-strings: nothing to emit from ${ widgets } widget.json file(s); ${ outFile } removed if present`
);
