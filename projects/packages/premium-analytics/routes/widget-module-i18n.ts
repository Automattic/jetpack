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
import { useEffect, useMemo, useState } from '@wordpress/element';
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
	// A missing catalog resolves and the widget renders in English, and a
	// stalled download resolves after a bounded wait — so this should not
	// reject. If one ever escapes, import the module anyway: a widget that
	// never loads at all is worse than an untranslated one.
	return loadBundleI18nCatalog( TEXT_DOMAIN, bundlePath )
		.catch( () => undefined )
		.then( () => importModule( moduleId ) );
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
 * Options narrowing which records `useWidgetTypesWithI18n` resolves.
 */
export interface UseWidgetTypesWithI18nOptions {
	/**
	 * Widget type names the active layout renders. Only these records are
	 * resolved — and only their catalogs downloaded — until `includeAll` turns
	 * on. Three states, because "the layout is empty" and "the layout has not
	 * loaded yet" must not be treated alike:
	 *
	 * - `undefined` — the caller does no scoping; resolve every record.
	 * - `null` — the caller scopes, but its layout has not resolved yet.
	 * - `string[]` — the names on screen; `[]` means genuinely nothing.
	 *
	 * The `null` state matters because hooks cannot be skipped: a caller that
	 * renders a spinner until its layout arrives still calls this hook on those
	 * renders, and treating that as an empty layout would preload the whole
	 * registry before the layout could ever narrow it.
	 */
	visibleNames?: string[] | null;
	/**
	 * Resolve every record regardless of `visibleNames`. Latches: once true,
	 * the registry stays complete for the life of the page.
	 */
	includeAll?: boolean;
}

/**
 * `useWidgetTypes`, gated on the records' translation catalogs and scoped to
 * the widgets on screen.
 *
 * `useWidgetTypes` imports every record's `widget.js` metadata module, which
 * evaluates `__()` at module scope — so the records are handed over only once
 * their catalogs are installed. Until then the hook reports resolving, same
 * as while the records themselves are still loading.
 *
 * Because that import is eager and has no resolver seam, handing over the full
 * record set puts one catalog request per registered widget on the boot
 * critical path. `options.visibleNames` narrows the set to the widgets the
 * active layout renders; `options.includeAll` widens it back out when the
 * complete registry is needed, which in practice means when the widget picker
 * mounts in edit mode. Widening cannot disturb what is already on screen:
 * `useWidgetTypes` keeps its previous types while re-resolving, and the host
 * consults `isResolving` only for widgets whose type it cannot find.
 *
 * Once `@wordpress/widget-primitives` resolves widget metadata lazily per
 * rendered widget (JETPACK-2095), this scoping and the gate can both go.
 *
 * @param records - Host-supplied records, or `null`/`undefined` while loading.
 * @param options - Scoping options; omit to resolve every record.
 * @return The resolved widget types and whether resolution is still in progress.
 */
export function useWidgetTypesWithI18n(
	records: WidgetModuleRecord[] | null | undefined,
	options: UseWidgetTypesWithI18nOptions = {}
): readonly [ WidgetType[], boolean ] {
	const { visibleNames, includeAll = false } = options;

	const isScoped = visibleNames !== undefined;
	const layoutKnown = Array.isArray( visibleNames );
	// Keyed on the names themselves rather than the array, so a caller that
	// builds `visibleNames` inline on every render does not restart resolution.
	const visibleKey = layoutKnown ? [ ...visibleNames ].sort().join( '\n' ) : null;

	const [ neededNames, setNeededNames ] = useState< ReadonlySet< string > >(
		() => new Set< string >()
	);
	const [ seenVisibleKey, setSeenVisibleKey ] = useState< string | null >( null );
	const [ resolveAll, setResolveAll ] = useState( includeAll );

	// Adjusted during render, not in an effect: an effect would leave the first
	// render scoped to an empty set, which falls back to every record below and
	// would start the very preload this scoping exists to avoid. React discards
	// the render that schedules these and re-runs immediately, so no effect of
	// this component runs against the stale values.
	if ( visibleKey !== null && visibleKey !== seenVisibleKey ) {
		setSeenVisibleKey( visibleKey );
		setNeededNames( current => {
			const names = visibleKey === '' ? [] : visibleKey.split( '\n' );
			if ( names.every( name => current.has( name ) ) ) {
				return current;
			}
			// Grows only: a section the user has already visited must not drop
			// back to a loading state when they return to it.
			return new Set( [ ...current, ...names ] );
		} );
	}
	if ( includeAll && ! resolveAll ) {
		setResolveAll( true );
	}

	const scopedRecords = useMemo( () => {
		if ( ! records || records.length === 0 || resolveAll || ! isScoped ) {
			return records;
		}
		if ( ! layoutKnown ) {
			// Resolve nothing until the caller's layout arrives. Falling through
			// to the empty-scope branch below would preload the whole registry
			// on the renders before the layout could ever narrow it — which is
			// every load, since hooks run even while the caller renders a
			// spinner.
			return null;
		}
		const subset = records.filter( record => neededNames.has( record.name ) );
		// A settled but empty layout means nothing is on screen to protect —
		// and the dashboard force-opens edit mode in that state, where the full
		// registry is needed anyway. Handing over an empty array instead would
		// report "resolved, no types" and render every layout widget as missing
		// rather than loading.
		return subset.length > 0 ? subset : records;
		// No `visibleKey` dependency: the names live in `neededNames`, whose
		// identity changes exactly when the set grew. A layout that only loses
		// names leaves the scope alone, which is the cumulative behaviour.
	}, [ records, resolveAll, isScoped, layoutKnown, neededNames ] );

	const [ readyRecords, setReadyRecords ] = useState< WidgetModuleRecord[] | null >( null );

	useEffect( () => {
		if ( ! scopedRecords || scopedRecords.length === 0 ) {
			// Nothing to preload; these records pass straight through below.
			return;
		}
		let cancelled = false;
		preloadWidgetModuleCatalogs( scopedRecords )
			// Defensive: every failure path inside the preload already falls
			// back to English on its own, so this should not fire. If one ever
			// escapes, open the gate anyway — an untranslated grid beats one
			// stranded on placeholders for the rest of the page.
			.catch( () => undefined )
			.then( () => {
				if ( ! cancelled ) {
					setReadyRecords( scopedRecords );
				}
			} );
		return () => {
			cancelled = true;
		};
	}, [ scopedRecords ] );

	// Gate by identity: only the exact records array whose preload finished is
	// handed over, so a records update closes the gate until its own preload
	// completes — and loading/empty records need no state round-trip at all.
	let gatedRecords: WidgetModuleRecord[] | null;
	if ( ! scopedRecords || scopedRecords.length === 0 ) {
		gatedRecords = scopedRecords ?? null;
	} else {
		gatedRecords = readyRecords === scopedRecords ? scopedRecords : null;
	}

	return useWidgetTypes( gatedRecords );
}
