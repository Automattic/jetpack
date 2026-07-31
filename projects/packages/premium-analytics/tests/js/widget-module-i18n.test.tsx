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
} );
