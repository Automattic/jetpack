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
 * How long the registry warm-up will wait for an idle moment before running
 * anyway. Long enough for the dashboard's own data requests to get away first,
 * short enough that the registry is warm well before anyone opens the widget
 * picker.
 */
const REGISTRY_WARM_TIMEOUT_MS = 5000;

/**
 * Delay used to approximate an idle moment where `requestIdleCallback` is
 * unavailable (Safari before 16.4, jsdom).
 */
const REGISTRY_WARM_FALLBACK_MS = 2000;

/**
 * How many catalog downloads the background registry warm-up keeps in flight.
 *
 * Deliberately below the loader's six-slot concurrency cap. The queue is shared
 * and FIFO, so anything the warm-up has queued delays a download requested
 * after it — including a widget's own `render.js` catalog, which blocks that
 * widget's import and carries a bound that counts its queue wait. Holding at
 * most this many slots leaves the rest free, so such a download starts
 * immediately rather than waiting out the registry.
 */
const WARM_BATCH_SIZE = 3;

/**
 * Run a callback once the page goes idle.
 *
 * @param callback - Work to run.
 * @return Cancels the scheduled callback.
 */
function onIdle( callback: () => void ): () => void {
	const scheduler = globalThis as typeof globalThis & {
		requestIdleCallback?: ( cb: () => void, options?: { timeout: number } ) => number;
		cancelIdleCallback?: ( handle: number ) => void;
	};
	if ( typeof scheduler.requestIdleCallback === 'function' ) {
		const handle = scheduler.requestIdleCallback( callback, {
			timeout: REGISTRY_WARM_TIMEOUT_MS,
		} );
		return () => scheduler.cancelIdleCallback?.( handle );
	}
	const handle = setTimeout( callback, REGISTRY_WARM_FALLBACK_MS );
	return () => clearTimeout( handle );
}

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
 * Metadata (`widget.js`) bundle paths for a set of widget records, skipping
 * records with no widget module and ids that are not widget modules.
 *
 * @param records - Widget module records from the `/widget-modules` REST route.
 * @return The package-relative bundle paths, in record order.
 */
function metadataBundlePaths( records: WidgetModuleRecord[] ): string[] {
	return records
		.map( record =>
			record.widget_module ? widgetModuleBundlePath( record.widget_module ) : null
		)
		.filter( ( bundlePath ): bundlePath is string => bundlePath !== null );
}

/**
 * Install the metadata (`widget.js`) catalogs for a set of widget records.
 *
 * Requests everything at once: every caller of this has someone waiting on it —
 * the registry gate, or the widget picker behind `includeAll` — so it takes the
 * download queue at full width. Background work goes through
 * `warmWidgetModuleCatalogs` instead.
 *
 * @param records - Widget module records from the `/widget-modules` REST route.
 * @return Resolves once every catalog is installed (or has fallen back to English).
 */
export function preloadWidgetModuleCatalogs( records: WidgetModuleRecord[] ): Promise< void > {
	return Promise.all(
		metadataBundlePaths( records ).map( bundlePath =>
			loadBundleI18nCatalog( TEXT_DOMAIN, bundlePath, METADATA_CATALOG_TIMEOUT_MS )
		)
	).then( () => undefined );
}

/**
 * Install the metadata catalogs for a set of widget records as background work,
 * keeping at most `WARM_BATCH_SIZE` downloads in flight.
 *
 * Nothing awaits this, so it must not cost anything that is awaited. The
 * loader's queue is shared and FIFO: submitting the whole registry at once
 * would leave a widget's own `render.js` catalog — requested when the widget
 * mounts, with a caller blocked on it — queued behind dozens of downloads
 * nobody is waiting for, tripping its own bound and rendering the widget in
 * English. Batching below the queue's width keeps free slots, so those
 * downloads start immediately instead of queueing.
 *
 * @param records - Widget module records from the `/widget-modules` REST route.
 * @return Resolves once every catalog is installed (or has fallen back to English).
 */
export async function warmWidgetModuleCatalogs( records: WidgetModuleRecord[] ): Promise< void > {
	const bundlePaths = metadataBundlePaths( records );
	for ( let index = 0; index < bundlePaths.length; index += WARM_BATCH_SIZE ) {
		// Sequential on purpose — the whole point is to not have the next batch
		// sitting in the queue while this one drains.
		await Promise.all(
			bundlePaths
				.slice( index, index + WARM_BATCH_SIZE )
				.map( bundlePath =>
					loadBundleI18nCatalog( TEXT_DOMAIN, bundlePath, METADATA_CATALOG_TIMEOUT_MS )
				)
		);
	}
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
 * Scoping defers those requests rather than dropping them: once the widgets on
 * screen have resolved, the rest of the registry's catalogs are downloaded on
 * the next idle callback, a few at a time so the shared download queue keeps
 * free slots for anything a caller is actually blocked on. The widget picker
 * renders the registry it is given with no loading state of its own, so it must
 * never be the thing waiting on a download — but nothing it lists needs to be
 * on the boot critical path.
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
		// An empty scope resolves nothing, which is what `[]` means. Falling
		// back to the full record set here — on the theory that an empty
		// dashboard force-opens edit mode and needs the registry anyway — made
		// the scoping collapse whenever a layout was empty for a single render,
		// putting every catalog back on the boot critical path
		// non-deterministically. `includeAll` already covers the genuinely
		// empty dashboard, one render later and without the boot cost.
		return records.filter( record => neededNames.has( record.name ) );
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

	// The widget picker lists the complete registry and has no loading state of
	// its own — it renders whatever types the dashboard hands it, with a count
	// to match — so a registry still widening when edit mode opens briefly
	// shows a silently incomplete gallery. Warming the rest of the catalogs
	// once the page is idle keeps them off the boot critical path while leaving
	// `includeAll` a microtask of already-downloaded catalogs: the loader keys
	// its downloads by bundle path, so the gated preload adopts the promise
	// this one started rather than re-requesting.
	useEffect( () => {
		if ( ! isScoped || resolveAll || ! records || records.length === 0 ) {
			return;
		}
		// Nothing was scoped away, so there is nothing left to warm.
		if ( scopedRecords === records ) {
			return;
		}
		// Wait for the widgets on screen to finish. Warming earlier would queue
		// the whole registry into the same concurrency-limited download queue
		// they are draining, putting the visible grid behind the invisible
		// registry — the inversion this scoping exists to prevent.
		if ( readyRecords !== scopedRecords ) {
			return;
		}
		return onIdle( () => {
			// Failures already fall back to English inside the preload; nothing
			// here waits on the result, so a rejection has nowhere to go.
			warmWidgetModuleCatalogs( records ).catch( () => undefined );
		} );
	}, [ isScoped, resolveAll, records, scopedRecords, readyRecords ] );

	// Gate by identity: only the exact records array whose preload finished is
	// handed over, so a records update closes the gate until its own preload
	// completes — and loading/empty records need no state round-trip at all.
	let gatedRecords: WidgetModuleRecord[] | null;
	if ( ! scopedRecords || scopedRecords.length === 0 ) {
		gatedRecords = scopedRecords ?? null;
	} else {
		gatedRecords = readyRecords === scopedRecords ? scopedRecords : null;
	}

	const [ types, resolving ] = useWidgetTypes( gatedRecords );
	// The gate closes during render — a render-phase `setNeededNames` widens the
	// scope, which yields a new `scopedRecords` array the same pass — but
	// `useWidgetTypes` only raises its own flag from an effect, one commit
	// later. That commit in between reports the previous section's types as
	// resolved, and the host renders every widget it cannot find in them as
	// "Missing widget" rather than as loading. A closed gate is itself the
	// answer: records are being withheld, so resolution has not finished.
	return [ types, resolving || gatedRecords === null ] as const;
}
