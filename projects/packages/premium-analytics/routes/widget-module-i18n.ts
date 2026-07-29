/**
 * Per-widget translation catalog loading.
 *
 * The boot init module (`packages/init`) downloads catalogs only for the
 * route/module bundles it knows will load; widget bundles — two per widget,
 * `widget.js` metadata and `render.js` — are excluded so a page load doesn't
 * pay one HTTP request per widget for widgets that may never render. This
 * module is the other half of that split: it loads a widget bundle's catalog
 * at the moment the bundle itself is imported.
 *
 * Both halves matter because widget bundles evaluate `__()` at module scope
 * (e.g. metric label tables in `widget.ts`), so a catalog that arrives after
 * the import has evaluated leaves those strings untranslated for the rest of
 * the page. The catalog download is therefore awaited (bounded — a stalled
 * network falls back to English rather than wedging the import) *before* the
 * module is imported.
 */

/**
 * External dependencies
 */
import { loadBundleI18nCatalog } from '@automattic/jetpack-wp-build-polyfills/src/js/load-i18n-catalogs';
import { useEffect, useState } from '@wordpress/element';
import { useWidgetTypes } from '@wordpress/widget-primitives';
import type {
	ResolveWidgetModule,
	WidgetModuleRecord,
	WidgetType,
} from '@wordpress/widget-primitives';

/**
 * The module shape `ResolveWidgetModule` must yield. Not exported by
 * `@wordpress/widget-primitives` (only the resolver type is), so it is
 * derived here.
 */
type WidgetModule = Awaited< ReturnType< ResolveWidgetModule > >;

const TEXT_DOMAIN = 'jetpack-premium-analytics-pkg';

/**
 * Bound on the metadata-catalog preload. More generous than the loader's
 * per-download default because the preload pushes dozens of downloads through
 * the shared concurrency queue at once and each call's bound includes its
 * queue wait — on a slow origin the tail of the queue would trip a 5s bound
 * while draining normally. The preload gates only the widget registry (the
 * grid renders placeholders meanwhile), not first paint, so waiting longer is
 * cheap.
 */
const METADATA_CATALOG_TIMEOUT_MS = 15000;

/**
 * Widget script-module ids as registered by `build/widgets.php`:
 * `jetpack-premium-analytics/widgets/{widget-dir-name}/render` and
 * `…/widget`. The corresponding bundles land at
 * `build/widgets/{widget-dir-name}/{render,widget}.js`, which is the
 * package-relative path format the build's i18n manifest lists.
 */
const WIDGET_MODULE_ID = /^jetpack-premium-analytics\/widgets\/([^/]+)\/(render|widget)$/;

/**
 * Map a widget script-module id to the bundle path its catalog is keyed by.
 *
 * @param moduleId - A script-module id from the page import map.
 * @return The package-relative bundle path, or `null` when the id is not a widget module.
 */
export function widgetModuleBundlePath( moduleId: string ): string | null {
	const match = WIDGET_MODULE_ID.exec( moduleId );
	return match ? `build/widgets/${ match[ 1 ] }/${ match[ 2 ] }.js` : null;
}

/**
 * `import()` a widget module, installing its translation catalog first.
 *
 * Drop-in for `WidgetDashboard`'s `resolveWidgetModule` prop, replacing the
 * default bare `import()`.
 *
 * @param moduleId     - The script-module id to import.
 * @param importModule - The import implementation; a parameter so tests can observe ordering.
 * @return The imported module.
 */
export function resolveWidgetModuleWithI18n(
	moduleId: string,
	importModule: ( id: string ) => Promise< WidgetModule > = id =>
		import( /* webpackIgnore: true */ id )
): Promise< WidgetModule > {
	const bundlePath = widgetModuleBundlePath( moduleId );
	if ( ! bundlePath ) {
		return importModule( moduleId );
	}
	// Never rejects: a missing catalog resolves and the widget renders in
	// English, and a stalled download resolves after a bounded wait.
	return loadBundleI18nCatalog( TEXT_DOMAIN, bundlePath ).then( () => importModule( moduleId ) );
}

/**
 * Install the metadata (`widget.js`) catalogs for a set of widget records.
 *
 * @param records - Widget module records from the `/widget-modules` REST route.
 * @return Resolves once every catalog is installed (or has fallen back to English).
 */
export function preloadWidgetModuleCatalogs( records: WidgetModuleRecord[] ): Promise< void > {
	return Promise.all(
		records.map( record => {
			const bundlePath = record.widget_module
				? widgetModuleBundlePath( record.widget_module )
				: null;
			return bundlePath
				? loadBundleI18nCatalog( TEXT_DOMAIN, bundlePath, METADATA_CATALOG_TIMEOUT_MS )
				: Promise.resolve();
		} )
	).then( () => undefined );
}

/**
 * `useWidgetTypes`, gated on the records' translation catalogs.
 *
 * `useWidgetTypes` imports every record's `widget.js` metadata module, which
 * evaluates `__()` at module scope — so the records are handed over only once
 * their catalogs are installed. Until then the hook reports resolving, same
 * as while the records themselves are still loading.
 *
 * @param records - Host-supplied records, or `null`/`undefined` while loading.
 * @return The resolved widget types and whether resolution is still in progress.
 */
export function useWidgetTypesWithI18n(
	records: WidgetModuleRecord[] | null | undefined
): readonly [ WidgetType[], boolean ] {
	const [ readyRecords, setReadyRecords ] = useState< WidgetModuleRecord[] | null >( null );

	useEffect( () => {
		if ( ! records || records.length === 0 ) {
			// Nothing to preload; these records pass straight through below.
			return;
		}
		let cancelled = false;
		preloadWidgetModuleCatalogs( records ).then( () => {
			if ( ! cancelled ) {
				setReadyRecords( records );
			}
		} );
		return () => {
			cancelled = true;
		};
	}, [ records ] );

	// Gate by identity: only the exact records array whose preload finished is
	// handed over, so a records update closes the gate until its own preload
	// completes — and loading/empty records need no state round-trip at all.
	let gatedRecords: WidgetModuleRecord[] | null;
	if ( ! records || records.length === 0 ) {
		gatedRecords = records ?? null;
	} else {
		gatedRecords = readyRecords === records ? records : null;
	}

	return useWidgetTypes( gatedRecords );
}
