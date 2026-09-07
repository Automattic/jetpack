import { loadBundleI18nCatalog } from '@automattic/jetpack-wp-build-polyfills/src/js/load-i18n-catalogs';
import { renderHook, waitFor } from '@testing-library/react';
import { useEffect, useState } from '@wordpress/element';
import { useWidgetTypes } from '@wordpress/widget-primitives';
import {
	preloadWidgetModuleCatalogs,
	resolveWidgetModuleWithI18n,
	useWidgetTypesWithI18n,
	widgetModuleBundlePath,
} from '../../routes/widget-module-i18n';
import type { ResolveWidgetModule, WidgetModuleRecord } from '@wordpress/widget-primitives';

type WidgetModule = Awaited< ReturnType< ResolveWidgetModule > >;

jest.mock( '@automattic/jetpack-wp-build-polyfills/src/js/load-i18n-catalogs', () => ( {
	loadBundleI18nCatalog: jest.fn( () => Promise.resolve() ),
} ) );

jest.mock( '@wordpress/widget-primitives', () => ( {
	useWidgetTypes: jest.fn(),
} ) );

const loadCatalogMock = loadBundleI18nCatalog as jest.Mock;
const useWidgetTypesMock = useWidgetTypes as jest.Mock;

/**
 * Synchronous stand-in for the real hook, which resolves its metadata imports
 * asynchronously and so reports `isResolving` on first render no matter what
 * it was handed. Resolving immediately for any non-null argument leaves the
 * gate as the only thing that can keep the hook resolving, which is what most
 * of these tests are here to check.
 *
 * @param records - The records handed to the hook.
 * @return The resolved types and whether resolution is in progress.
 */
function useWidgetTypesSyncStandIn( records: WidgetModuleRecord[] | null | undefined ) {
	return [ [], ! records ];
}

/**
 * Idle callbacks the registry warm-up has scheduled, in order. jsdom has no
 * `requestIdleCallback`, so without this stub the warm-up would fall back to a
 * real timer and fire after the test that scheduled it had ended.
 */
let idleCallbacks: Array< () => void > = [];

const realRequestIdleCallback = globalThis.requestIdleCallback;
const realCancelIdleCallback = globalThis.cancelIdleCallback;

/**
 * Run every idle callback scheduled so far.
 */
function runIdleCallbacks(): void {
	const pending = idleCallbacks;
	idleCallbacks = [];
	pending.forEach( callback => callback() );
}

beforeEach( () => {
	loadCatalogMock.mockClear();
	loadCatalogMock.mockImplementation( () => Promise.resolve() );
	useWidgetTypesMock.mockClear();
	useWidgetTypesMock.mockImplementation( useWidgetTypesSyncStandIn );

	idleCallbacks = [];
	globalThis.requestIdleCallback = ( ( callback: () => void ) => {
		idleCallbacks.push( callback );
		return idleCallbacks.length;
	} ) as typeof globalThis.requestIdleCallback;
	globalThis.cancelIdleCallback = ( ( handle: number ) => {
		idleCallbacks[ handle - 1 ] = () => {};
	} ) as typeof globalThis.cancelIdleCallback;
} );

afterEach( () => {
	globalThis.requestIdleCallback = realRequestIdleCallback;
	globalThis.cancelIdleCallback = realCancelIdleCallback;
} );

describe( 'widgetModuleBundlePath', () => {
	it( 'maps a widget render module id to its build bundle path', () => {
		expect(
			widgetModuleBundlePath( 'jetpack-premium-analytics/widgets/search-terms/render' )
		).toBe( 'build/widgets/search-terms/render.js' );
	} );

	it( 'maps a widget metadata module id to its build bundle path', () => {
		expect(
			widgetModuleBundlePath( 'jetpack-premium-analytics/widgets/search-terms/widget' )
		).toBe( 'build/widgets/search-terms/widget.js' );
	} );

	it( 'returns null for module ids that are not widget modules', () => {
		expect( widgetModuleBundlePath( '@jetpack-premium-analytics/init' ) ).toBeNull();
		expect( widgetModuleBundlePath( 'other-plugin/widgets/foo/render' ) ).toBeNull();
		expect(
			widgetModuleBundlePath( 'jetpack-premium-analytics/widgets/foo/render/extra' )
		).toBeNull();
		expect( widgetModuleBundlePath( 'jetpack-premium-analytics/widgets/foo/other' ) ).toBeNull();
	} );
} );

describe( 'resolveWidgetModuleWithI18n', () => {
	it( 'installs the widget catalog before importing the module', async () => {
		let catalogResolved = false;
		let catalogResolvedWhenImported: boolean | null = null;
		loadCatalogMock.mockImplementation(
			() =>
				new Promise< void >( resolve =>
					setTimeout( () => {
						catalogResolved = true;
						resolve();
					}, 0 )
				)
		);
		const theModule = { default: () => null } as unknown as WidgetModule;
		const importModule = jest.fn( () => {
			catalogResolvedWhenImported = catalogResolved;
			return Promise.resolve( theModule );
		} );

		const result = await resolveWidgetModuleWithI18n(
			'jetpack-premium-analytics/widgets/search-terms/render',
			importModule
		);

		expect( loadCatalogMock ).toHaveBeenCalledWith(
			'jetpack-premium-analytics-pkg',
			'build/widgets/search-terms/render.js'
		);
		expect( catalogResolvedWhenImported ).toBe( true );
		expect( result ).toBe( theModule );
	} );

	it( 'still imports the module when the catalog load rejects', async () => {
		loadCatalogMock.mockImplementation( () => Promise.reject( new Error( 'boom' ) ) );
		const theModule = { default: () => null } as unknown as WidgetModule;
		const importModule = jest.fn( () => Promise.resolve( theModule ) );

		// A widget that never loads at all is worse than an untranslated one.
		await expect(
			resolveWidgetModuleWithI18n(
				'jetpack-premium-analytics/widgets/search-terms/render',
				importModule
			)
		).resolves.toBe( theModule );
		expect( importModule ).toHaveBeenCalledWith(
			'jetpack-premium-analytics/widgets/search-terms/render'
		);
	} );

	it( 'imports non-widget module ids without a catalog request', async () => {
		const importModule = jest.fn( () =>
			Promise.resolve( { default: () => null } as unknown as WidgetModule )
		);

		await resolveWidgetModuleWithI18n( 'some/other/module', importModule );

		expect( loadCatalogMock ).not.toHaveBeenCalled();
		expect( importModule ).toHaveBeenCalledWith( 'some/other/module' );
	} );
} );

describe( 'preloadWidgetModuleCatalogs', () => {
	it( 'requests one catalog per record with a mappable widget module, with a generous bound', async () => {
		await preloadWidgetModuleCatalogs( [
			{ name: 'jpa/a', widget_module: 'jetpack-premium-analytics/widgets/a/widget' },
			{ name: 'jpa/b', widget_module: 'jetpack-premium-analytics/widgets/b/widget' },
			{ name: 'jpa/no-module' },
			{ name: 'jpa/odd', widget_module: 'not-a-widget-module' },
		] as WidgetModuleRecord[] );

		// The 15s bound: dozens of downloads drain through the shared
		// concurrency queue, and each call's bound includes its queue wait —
		// the default per-download bound would flag the tail of the queue on a
		// slow origin.
		expect( loadCatalogMock.mock.calls ).toEqual( [
			[ 'jetpack-premium-analytics-pkg', 'build/widgets/a/widget.js', 15000 ],
			[ 'jetpack-premium-analytics-pkg', 'build/widgets/b/widget.js', 15000 ],
		] );
	} );
} );

describe( 'useWidgetTypesWithI18n', () => {
	const RECORDS = [
		{
			name: 'jpa/a',
			widget_module: 'jetpack-premium-analytics/widgets/a/widget',
			render_module: 'jetpack-premium-analytics/widgets/a/render',
		},
	] as WidgetModuleRecord[];

	const SCOPED_RECORDS = [
		{
			name: 'jpa/a',
			widget_module: 'jetpack-premium-analytics/widgets/a/widget',
			render_module: 'jetpack-premium-analytics/widgets/a/render',
		},
		{
			name: 'jpa/b',
			widget_module: 'jetpack-premium-analytics/widgets/b/widget',
			render_module: 'jetpack-premium-analytics/widgets/b/render',
		},
		{
			name: 'jpa/c',
			widget_module: 'jetpack-premium-analytics/widgets/c/widget',
			render_module: 'jetpack-premium-analytics/widgets/c/render',
		},
	] as WidgetModuleRecord[];

	/**
	 * Bundle paths passed to the catalog loader so far.
	 *
	 * @return The requested bundle paths.
	 */
	function requestedBundles(): string[] {
		return loadCatalogMock.mock.calls.map( ( call: unknown[] ) => call[ 1 ] as string );
	}

	/**
	 * The records argument of the most recent `useWidgetTypes` call — what the
	 * gate has actually handed downstream on the latest render.
	 *
	 * @return The records the hook was last called with.
	 */
	function lastRecordsArg(): WidgetModuleRecord[] | null | undefined {
		const { calls } = useWidgetTypesMock.mock;
		if ( calls.length === 0 ) {
			throw new Error( 'useWidgetTypes was never called' );
		}
		return calls[ calls.length - 1 ][ 0 ];
	}

	/**
	 * Make catalog loads hang until the returned release function is called.
	 *
	 * @return Releases every pending catalog load.
	 */
	function holdCatalogs(): () => void {
		let release = () => {};
		loadCatalogMock.mockImplementation(
			() =>
				new Promise< void >( resolve => {
					release = resolve;
				} )
		);
		return () => release();
	}

	it( 'withholds the records from useWidgetTypes until their catalogs are installed', async () => {
		const releaseCatalogs = holdCatalogs();

		const { result } = renderHook( () => useWidgetTypesWithI18n( RECORDS ) );

		// Catalog pending: the records must not have reached useWidgetTypes,
		// which would import their metadata modules and evaluate the
		// module-scope `__()` calls against a catalog that is not installed
		// yet. Until then the hook reports resolving.
		expect( lastRecordsArg() ).toBeNull();
		expect( result.current[ 1 ] ).toBe( true );

		releaseCatalogs();

		// Handed over by identity, not by an equal copy.
		await waitFor( () => expect( lastRecordsArg() ).toBe( RECORDS ) );
		expect( result.current[ 1 ] ).toBe( false );
	} );

	it( 'closes the gate again when a new records array arrives', async () => {
		const { result, rerender } = renderHook(
			( { records }: { records: WidgetModuleRecord[] } ) => useWidgetTypesWithI18n( records ),
			{ initialProps: { records: RECORDS } }
		);
		await waitFor( () => expect( lastRecordsArg() ).toBe( RECORDS ) );

		// A refetch yields an equal-but-new array whose own catalogs have not
		// been preloaded; it must not pass through on the strength of the
		// previous array's preload.
		const releaseCatalogs = holdCatalogs();
		const nextRecords = [ ...RECORDS ];
		rerender( { records: nextRecords } );

		expect( lastRecordsArg() ).toBeNull();
		expect( result.current[ 1 ] ).toBe( true );

		releaseCatalogs();
		await waitFor( () => expect( lastRecordsArg() ).toBe( nextRecords ) );
	} );

	it( 'opens the gate even when a catalog load rejects', async () => {
		// The preload is not supposed to reject — each catalog load falls back
		// to English on its own. If one ever escapes, the grid must still get
		// its widgets rather than sitting on placeholders for the page.
		loadCatalogMock.mockImplementation( () => Promise.reject( new Error( 'catalog exploded' ) ) );

		const { result } = renderHook( () => useWidgetTypesWithI18n( RECORDS ) );

		await waitFor( () => expect( lastRecordsArg() ).toBe( RECORDS ) );
		expect( result.current[ 1 ] ).toBe( false );
	} );

	it( 'reports resolving while records are still loading', () => {
		const { result } = renderHook( () => useWidgetTypesWithI18n( null ) );
		expect( lastRecordsArg() ).toBeNull();
		expect( result.current[ 1 ] ).toBe( true );
		expect( loadCatalogMock ).not.toHaveBeenCalled();
	} );

	it( 'passes an empty record set straight through, with no catalog requests', () => {
		// Stable reference, as core-data returns in production — `useWidgetTypes`
		// (upstream) re-runs its effect on every records identity change.
		const emptyRecords: WidgetModuleRecord[] = [];
		const { result } = renderHook( () => useWidgetTypesWithI18n( emptyRecords ) );
		// No async gate for zero records: nothing to translate, so the empty
		// set must not wait on a preload round-trip.
		expect( lastRecordsArg() ).toBe( emptyRecords );
		expect( result.current ).toEqual( [ [], false ] );
		expect( loadCatalogMock ).not.toHaveBeenCalled();
	} );

	it( 'loads catalogs only for the widgets the layout renders', async () => {
		const { result } = renderHook( () =>
			useWidgetTypesWithI18n( SCOPED_RECORDS, { visibleNames: [ 'jpa/b' ] } )
		);

		await waitFor( () => expect( result.current[ 1 ] ).toBe( false ) );

		// A registered-but-not-laid-out widget's metadata catalog is what this
		// change exists to stop requesting at boot.
		expect( requestedBundles() ).toEqual( [ 'build/widgets/b/widget.js' ] );
	} );

	it( 'hands useWidgetTypes only the scoped subset', async () => {
		renderHook( () => useWidgetTypesWithI18n( SCOPED_RECORDS, { visibleNames: [ 'jpa/b' ] } ) );

		await waitFor( () => expect( lastRecordsArg() ).not.toBeNull() );
		expect( lastRecordsArg() ).toEqual( [ SCOPED_RECORDS[ 1 ] ] );
	} );

	it( 'keeps the scoped array stable across renders with an equal visibleNames array', async () => {
		const { rerender } = renderHook(
			( { names }: { names: string[] } ) =>
				useWidgetTypesWithI18n( SCOPED_RECORDS, { visibleNames: names } ),
			{ initialProps: { names: [ 'jpa/b' ] } }
		);
		await waitFor( () => expect( lastRecordsArg() ).not.toBeNull() );
		const firstScoped = lastRecordsArg();

		// A caller building `visibleNames` inline re-creates the array every
		// render; that must not restart resolution.
		rerender( { names: [ 'jpa/b' ] } );

		expect( lastRecordsArg() ).toBe( firstScoped );
		expect( requestedBundles() ).toEqual( [ 'build/widgets/b/widget.js' ] );
	} );

	it( 'unions newly visible widgets rather than replacing the scope', async () => {
		const { rerender } = renderHook(
			( { names }: { names: string[] } ) =>
				useWidgetTypesWithI18n( SCOPED_RECORDS, { visibleNames: names } ),
			{ initialProps: { names: [ 'jpa/a' ] } }
		);
		await waitFor( () => expect( lastRecordsArg() ).not.toBeNull() );

		// Switching sections must not drop the previous section's widgets back
		// into a loading state when the user returns to it.
		rerender( { names: [ 'jpa/c' ] } );

		await waitFor( () =>
			expect( lastRecordsArg() ).toEqual( [ SCOPED_RECORDS[ 0 ], SCOPED_RECORDS[ 2 ] ] )
		);
		// The second preload re-requests `a` alongside `c`; the real loader
		// dedupes that, the mock records both. Assert on the distinct set — the
		// point is that `b` is still never requested.
		expect( new Set( requestedBundles() ) ).toEqual(
			new Set( [ 'build/widgets/a/widget.js', 'build/widgets/c/widget.js' ] )
		);
	} );

	it( 'expands to every record once includeAll turns on, and stays expanded', async () => {
		const { rerender } = renderHook(
			( { includeAll }: { includeAll: boolean } ) =>
				useWidgetTypesWithI18n( SCOPED_RECORDS, { visibleNames: [ 'jpa/b' ], includeAll } ),
			{ initialProps: { includeAll: false } }
		);
		await waitFor( () => expect( lastRecordsArg() ).not.toBeNull() );

		// WidgetPicker lists the complete registry, so edit mode needs it all.
		rerender( { includeAll: true } );
		await waitFor( () => expect( lastRecordsArg() ).toBe( SCOPED_RECORDS ) );

		// Latched: leaving edit mode must not shrink the registry and drop
		// types the picker has already listed.
		rerender( { includeAll: false } );
		expect( lastRecordsArg() ).toBe( SCOPED_RECORDS );
	} );

	it( 'preloads nothing while the caller has not resolved its layout', async () => {
		// Hooks cannot be skipped, so a caller that renders a spinner until its
		// layout arrives still calls this hook meanwhile. Treating that as an
		// empty layout would fall through to the every-record branch below and
		// preload the whole registry before the layout could narrow it — which
		// is what shipped and made the scoping a no-op on every real load.
		const { rerender } = renderHook(
			( { names }: { names: string[] | null } ) =>
				useWidgetTypesWithI18n( SCOPED_RECORDS, { visibleNames: names } ),
			{ initialProps: { names: null as string[] | null } }
		);

		expect( lastRecordsArg() ).toBeNull();
		expect( loadCatalogMock ).not.toHaveBeenCalled();

		rerender( { names: [ 'jpa/b' ] } );

		await waitFor( () => expect( lastRecordsArg() ).toEqual( [ SCOPED_RECORDS[ 1 ] ] ) );
		expect( requestedBundles() ).toEqual( [ 'build/widgets/b/widget.js' ] );
	} );

	it( 'resolves nothing when nothing is on screen, leaving the registry to includeAll', async () => {
		// A genuinely empty dashboard force-opens edit mode, which turns
		// `includeAll` on and takes the full registry a render later. Falling
		// back to every record here instead would put that registry on the boot
		// critical path for anyone whose layout is empty for even one render.
		const { rerender } = renderHook(
			( { includeAll }: { includeAll: boolean } ) =>
				useWidgetTypesWithI18n( SCOPED_RECORDS, { visibleNames: [], includeAll } ),
			{ initialProps: { includeAll: false } }
		);

		await waitFor( () => expect( lastRecordsArg() ).toEqual( [] ) );
		expect( loadCatalogMock ).not.toHaveBeenCalled();

		rerender( { includeAll: true } );
		await waitFor( () => expect( lastRecordsArg() ).toBe( SCOPED_RECORDS ) );
	} );

	it( 'does not preload the whole registry over a layout that is briefly empty', async () => {
		// The scoping is only worth anything if it holds on every load. A
		// layout that arrives a render late used to collapse the scope to the
		// full record set, which is both the boot cost this exists to avoid and
		// enough queue traffic to push later per-widget catalogs past their own
		// timeout.
		const { rerender } = renderHook(
			( { names }: { names: string[] } ) =>
				useWidgetTypesWithI18n( SCOPED_RECORDS, { visibleNames: names } ),
			{ initialProps: { names: [] as string[] } }
		);

		expect( loadCatalogMock ).not.toHaveBeenCalled();

		rerender( { names: [ 'jpa/b' ] } );

		await waitFor( () => expect( lastRecordsArg() ).toEqual( [ SCOPED_RECORDS[ 1 ] ] ) );
		expect( requestedBundles() ).toEqual( [ 'build/widgets/b/widget.js' ] );
	} );

	it( 'keeps the gate closed until the scoped catalogs are installed', async () => {
		const releaseCatalogs = holdCatalogs();

		const { result } = renderHook( () =>
			useWidgetTypesWithI18n( SCOPED_RECORDS, { visibleNames: [ 'jpa/b' ] } )
		);

		expect( lastRecordsArg() ).toBeNull();
		expect( result.current[ 1 ] ).toBe( true );

		releaseCatalogs();
		await waitFor( () => expect( lastRecordsArg() ).toEqual( [ SCOPED_RECORDS[ 1 ] ] ) );
	} );

	describe( 'registry warm-up', () => {
		// Enough records that a batched warm-up is distinguishable from an
		// all-at-once one.
		const MANY_RECORDS = Array.from( { length: 7 }, ( _, index ) => ( {
			name: `jpa/w${ index }`,
			widget_module: `jetpack-premium-analytics/widgets/w${ index }/widget`,
			render_module: `jetpack-premium-analytics/widgets/w${ index }/render`,
		} ) ) as WidgetModuleRecord[];

		/**
		 * Let pending promise chains and timers run.
		 *
		 * @return Resolves on the next macrotask.
		 */
		function flush(): Promise< void > {
			return new Promise( resolve => {
				setTimeout( resolve, 0 );
			} );
		}

		/**
		 * Make catalog loads hang, recording how many are in flight at once.
		 *
		 * @return The in-flight tracker and a release for the pending loads.
		 */
		function trackInFlight() {
			let inFlight = 0;
			const tracker = { max: 0 };
			let pending: Array< () => void > = [];
			loadCatalogMock.mockImplementation(
				() =>
					new Promise< void >( resolve => {
						inFlight++;
						tracker.max = Math.max( tracker.max, inFlight );
						pending.push( () => {
							inFlight--;
							resolve();
						} );
					} )
			);
			return {
				tracker,
				releaseAll: () => {
					const settling = pending;
					pending = [];
					settling.forEach( release => release() );
				},
			};
		}

		it( 'never holds more than half the download slots while warming', async () => {
			// The loader's queue is shared and FIFO, so a warm-up that submits
			// the whole registry at once leaves a widget's own render catalog —
			// which blocks that widget's import — queued behind downloads
			// nobody is waiting for, past its own bound. Staying under the
			// six-slot cap keeps slots free for it.
			renderHook( () => useWidgetTypesWithI18n( MANY_RECORDS, { visibleNames: [ 'jpa/w0' ] } ) );
			await waitFor( () => expect( idleCallbacks ).toHaveLength( 1 ) );

			const { tracker, releaseAll } = trackInFlight();
			const before = requestedBundles().length;
			runIdleCallbacks();

			for ( let pass = 0; pass < 10 && requestedBundles().length - before < 7; pass++ ) {
				await flush();
				releaseAll();
			}
			await flush();

			expect( tracker.max ).toBeLessThanOrEqual( 3 );
			expect( requestedBundles().length - before ).toBe( 7 );
		} );

		it( 'does not batch the gated preload, which has the picker waiting on it', async () => {
			const { rerender } = renderHook(
				( { includeAll }: { includeAll: boolean } ) =>
					useWidgetTypesWithI18n( MANY_RECORDS, { visibleNames: [ 'jpa/w0' ], includeAll } ),
				{ initialProps: { includeAll: false } }
			);
			await waitFor( () => expect( idleCallbacks ).toHaveLength( 1 ) );

			const { tracker } = trackInFlight();
			rerender( { includeAll: true } );
			await flush();

			// Someone is blocked on this one, so it takes the queue at full
			// width rather than trickling.
			expect( tracker.max ).toBe( 7 );
		} );

		it( 'warms the rest of the registry once the widgets on screen have resolved', async () => {
			renderHook( () => useWidgetTypesWithI18n( SCOPED_RECORDS, { visibleNames: [ 'jpa/b' ] } ) );
			await waitFor( () => expect( lastRecordsArg() ).not.toBeNull() );

			// Boot pays for the widget on screen and nothing else.
			expect( requestedBundles() ).toEqual( [ 'build/widgets/b/widget.js' ] );

			// The widget picker lists the complete registry with no loading
			// state of its own, so the catalogs it needs are downloaded before
			// edit mode can ask for them — just not on the boot critical path.
			runIdleCallbacks();

			expect( new Set( requestedBundles() ) ).toEqual(
				new Set( [
					'build/widgets/a/widget.js',
					'build/widgets/b/widget.js',
					'build/widgets/c/widget.js',
				] )
			);
		} );

		it( 'schedules no warm-up until the widgets on screen have resolved', async () => {
			const releaseCatalogs = holdCatalogs();

			renderHook( () => useWidgetTypesWithI18n( SCOPED_RECORDS, { visibleNames: [ 'jpa/b' ] } ) );
			await waitFor( () =>
				expect( requestedBundles() ).toEqual( [ 'build/widgets/b/widget.js' ] )
			);

			// Warming early would queue the whole registry into the same
			// concurrency-limited queue the visible widget is draining.
			expect( idleCallbacks ).toEqual( [] );

			releaseCatalogs();
			await waitFor( () => expect( idleCallbacks ).toHaveLength( 1 ) );
		} );

		it( 'schedules no warm-up for a caller that does not scope', async () => {
			renderHook( () => useWidgetTypesWithI18n( RECORDS ) );

			await waitFor( () => expect( lastRecordsArg() ).toBe( RECORDS ) );
			// Nothing was held back, so there is nothing left to warm.
			expect( idleCallbacks ).toEqual( [] );
		} );

		it( 'cancels a pending warm-up when includeAll takes over', async () => {
			const { rerender } = renderHook(
				( { includeAll }: { includeAll: boolean } ) =>
					useWidgetTypesWithI18n( SCOPED_RECORDS, { visibleNames: [ 'jpa/b' ], includeAll } ),
				{ initialProps: { includeAll: false } }
			);
			await waitFor( () => expect( idleCallbacks ).toHaveLength( 1 ) );

			rerender( { includeAll: true } );
			await waitFor( () => expect( lastRecordsArg() ).toBe( SCOPED_RECORDS ) );
			runIdleCallbacks();

			// `includeAll` preloads the full registry itself; the warm-up must
			// not fire a second, redundant pass behind it.
			expect(
				loadCatalogMock.mock.calls.filter( call => call[ 1 ] === 'build/widgets/a/widget.js' )
			).toHaveLength( 1 );
		} );
	} );

	describe( 'with useWidgetTypes timed the way upstream times it', () => {
		/**
		 * A stand-in that flips its flags from an effect, exactly as the real
		 * `useWidgetTypes` does. The synchronous stand-in above cannot see the
		 * frame these tests cover: upstream keeps reporting the *previous*
		 * records as resolved for one commit after the gate closes, because the
		 * gate closes during render and the flag only moves an effect later.
		 *
		 * @param records - The records handed to the hook.
		 * @return The resolved types and whether resolution is in progress.
		 */
		function useWidgetTypesLikeUpstream( records: WidgetModuleRecord[] | null | undefined ) {
			const [ types, setTypes ] = useState< Array< { name: string } > >( [] );
			const [ resolving, setResolving ] = useState( true );
			useEffect( () => {
				if ( ! records ) {
					setResolving( true );
					return;
				}
				let cancelled = false;
				setResolving( true );
				Promise.resolve().then( () => {
					if ( ! cancelled ) {
						setTypes( records.map( record => ( { name: record.name } ) ) );
						setResolving( false );
					}
				} );
				return () => {
					cancelled = true;
				};
			}, [ records ] );
			return [ types, resolving ];
		}

		/**
		 * Render the hook, recording every committed `[ type names, resolving ]`
		 * frame.
		 *
		 * @param names - The initial `visibleNames`.
		 * @return The recorded frames and a rerender that changes `visibleNames`.
		 */
		function renderRecordingFrames( names: string[] ) {
			useWidgetTypesMock.mockImplementation( useWidgetTypesLikeUpstream );
			const frames: Array< [ string[], boolean ] > = [];
			const { rerender } = renderHook(
				( props: { names: string[] } ) => {
					const value = useWidgetTypesWithI18n( SCOPED_RECORDS, {
						visibleNames: props.names,
					} );
					// No dependency array, so this records every commit — and
					// only commits: a render React discards over a render-phase
					// state update never runs its effects.
					useEffect( () => {
						frames.push( [ value[ 0 ].map( type => type.name ), value[ 1 ] ] );
					} );
					return value;
				},
				{ initialProps: { names } }
			);
			return { frames, rerender };
		}

		it( 'never reports resolved with a stale type set while a section switch resolves', async () => {
			const { frames, rerender } = renderRecordingFrames( [ 'jpa/a' ] );
			await waitFor( () => expect( frames.at( -1 ) ).toEqual( [ [ 'jpa/a' ], false ] ) );

			frames.length = 0;
			rerender( { names: [ 'jpa/b' ] } );
			await waitFor( () => expect( frames.at( -1 ) ).toEqual( [ [ 'jpa/a', 'jpa/b' ], false ] ) );

			// The gate closes during the render that widens the scope, but
			// `useWidgetTypes` only raises its own flag an effect later. A
			// committed frame that claims "resolved" while the incoming
			// section's type is still missing is the frame the dashboard
			// renders as a "Missing widget" placeholder.
			expect(
				frames.filter( ( [ typeNames, resolving ] ) => {
					return ! resolving && ! typeNames.includes( 'jpa/b' );
				} )
			).toEqual( [] );
		} );

		it( 'never reports resolved before the first scoped preload finishes', async () => {
			const { frames } = renderRecordingFrames( [ 'jpa/b' ] );
			await waitFor( () => expect( frames.at( -1 ) ).toEqual( [ [ 'jpa/b' ], false ] ) );

			expect(
				frames.filter( ( [ typeNames, resolving ] ) => {
					return ! resolving && ! typeNames.includes( 'jpa/b' );
				} )
			).toEqual( [] );
		} );
	} );
} );
