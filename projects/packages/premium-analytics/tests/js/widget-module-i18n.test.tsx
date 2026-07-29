import { loadBundleI18nCatalog } from '@automattic/jetpack-wp-build-polyfills/src/js/load-i18n-catalogs';
import { renderHook, waitFor } from '@testing-library/react';
import {
	preloadWidgetModuleCatalogs,
	resolveWidgetModuleWithI18n,
	useWidgetTypesWithI18n,
	widgetModuleBundlePath,
} from '../../routes/widget-module-i18n';
import type { WidgetModuleRecord } from '@wordpress/widget-primitives';

jest.mock( '@automattic/jetpack-wp-build-polyfills/src/js/load-i18n-catalogs', () => ( {
	loadBundleI18nCatalog: jest.fn( () => Promise.resolve() ),
} ) );

const loadCatalogMock = loadBundleI18nCatalog as jest.Mock;

beforeEach( () => {
	loadCatalogMock.mockClear();
	loadCatalogMock.mockImplementation( () => Promise.resolve() );
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
		const importModule = jest.fn( () => {
			catalogResolvedWhenImported = catalogResolved;
			return Promise.resolve( { default: 'the-module' } );
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
		expect( result ).toEqual( { default: 'the-module' } );
	} );

	it( 'imports non-widget module ids without a catalog request', async () => {
		const importModule = jest.fn( () => Promise.resolve( { default: 'x' } ) );

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

	it( 'stays resolving until the metadata catalogs are installed', async () => {
		let releaseCatalog = () => {};
		loadCatalogMock.mockImplementation(
			() =>
				new Promise< void >( resolve => {
					releaseCatalog = resolve;
				} )
		);

		const { result } = renderHook( () => useWidgetTypesWithI18n( RECORDS ) );

		// Catalog pending: the records must not have been handed to
		// useWidgetTypes yet, so the hook still reports resolving.
		expect( result.current[ 1 ] ).toBe( true );

		releaseCatalog();
		await waitFor( () => expect( result.current[ 1 ] ).toBe( false ) );
	} );

	it( 'reports resolving while records are still loading', () => {
		const { result } = renderHook( () => useWidgetTypesWithI18n( null ) );
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
		expect( result.current ).toEqual( [ [], false ] );
		expect( loadCatalogMock ).not.toHaveBeenCalled();
	} );
} );
