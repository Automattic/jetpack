import { loadBundleI18nCatalog } from '@automattic/jetpack-wp-build-polyfills/src/js/load-i18n-catalogs';
import { renderHook, waitFor } from '@testing-library/react';
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
	// Synchronous stand-in for the real hook, which resolves its metadata
	// imports asynchronously and so reports `isResolving` on first render no
	// matter what it was handed. Resolving immediately for any non-null
	// argument leaves the gate as the only thing that can keep the hook
	// resolving, which is what these tests are here to check.
	useWidgetTypes: jest.fn( ( records: WidgetModuleRecord[] | null | undefined ) => [
		[],
		! records,
	] ),
} ) );

const loadCatalogMock = loadBundleI18nCatalog as jest.Mock;
const useWidgetTypesMock = useWidgetTypes as jest.Mock;

beforeEach( () => {
	loadCatalogMock.mockClear();
	loadCatalogMock.mockImplementation( () => Promise.resolve() );
	useWidgetTypesMock.mockClear();
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

	it( 'falls back to every record when nothing is on screen', async () => {
		// An empty layout means there is nothing to protect, and the dashboard
		// force-opens edit mode in that state. Handing over an empty array
		// instead would report "resolved, no types" and render any layout
		// widget as missing rather than loading.
		renderHook( () => useWidgetTypesWithI18n( SCOPED_RECORDS, { visibleNames: [] } ) );

		await waitFor( () => expect( lastRecordsArg() ).toBe( SCOPED_RECORDS ) );
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
} );
