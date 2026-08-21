import { render, act } from '@testing-library/react';
import { GlobalChartsProvider } from '../global-charts-provider';
import { useDefaultHiddenSeries } from '../hooks/use-default-hidden-series';
import { useGlobalChartsContext } from '../hooks/use-global-charts-context';
import type { GlobalChartsContextValue } from '../types';

describe( 'useDefaultHiddenSeries', () => {
	let contextValue: GlobalChartsContextValue;
	let resolvedHiddenSeries: Set< string >;

	const Grab = () => {
		contextValue = useGlobalChartsContext();
		return null;
	};

	const Chart = ( { defaults, chartId = 'chart' }: { defaults?: string[]; chartId?: string } ) => {
		resolvedHiddenSeries = useDefaultHiddenSeries( chartId, defaults );
		return null;
	};

	it( 'hides the named series at mount', () => {
		render(
			<GlobalChartsProvider>
				<Grab />
				<Chart defaults={ [ 'Visitors' ] } />
			</GlobalChartsProvider>
		);

		expect( contextValue.isSeriesVisible( 'chart', 'Visitors' ) ).toBe( false );
		expect( contextValue.isSeriesVisible( 'chart', 'Views' ) ).toBe( true );
	} );

	it( 'writes nothing when no defaults are given', () => {
		render(
			<GlobalChartsProvider>
				<Grab />
				<Chart />
			</GlobalChartsProvider>
		);

		expect( contextValue.getHiddenSeries( 'chart' ) ).toEqual( new Set() );
	} );

	it( 'reflects provider visibility changes after mount', () => {
		render(
			<GlobalChartsProvider>
				<Grab />
				<Chart />
			</GlobalChartsProvider>
		);

		expect( resolvedHiddenSeries.has( 'Visitors' ) ).toBe( false );

		act( () => {
			contextValue.setSeriesVisibility( 'chart', 'Visitors', false );
		} );

		expect( resolvedHiddenSeries.has( 'Visitors' ) ).toBe( true );
	} );

	it( 'seeds the first defined value and ignores later values for the same chart ID', () => {
		const Harness = ( { defaults }: { defaults?: string[] } ) => (
			<GlobalChartsProvider>
				<Grab />
				<Chart defaults={ defaults } />
			</GlobalChartsProvider>
		);

		const { rerender } = render( <Harness /> );

		rerender( <Harness defaults={ [ 'Visitors' ] } /> );
		expect( contextValue.getHiddenSeries( 'chart' ) ).toEqual( new Set( [ 'Visitors' ] ) );

		rerender( <Harness defaults={ [ 'Views' ] } /> );
		expect( contextValue.getHiddenSeries( 'chart' ) ).toEqual( new Set( [ 'Visitors' ] ) );
	} );

	it( 'treats an empty array as a defined default', () => {
		const Harness = ( { defaults }: { defaults: string[] } ) => (
			<GlobalChartsProvider>
				<Grab />
				<Chart defaults={ defaults } />
			</GlobalChartsProvider>
		);

		const { rerender } = render( <Harness defaults={ [] } /> );

		rerender( <Harness defaults={ [ 'Visitors' ] } /> );

		expect( contextValue.getHiddenSeries( 'chart' ) ).toEqual( new Set() );
	} );

	it( 'does not re-hide a series the user revealed', () => {
		const Harness = () => (
			<GlobalChartsProvider>
				<Grab />
				<Chart defaults={ [ 'Visitors' ] } />
			</GlobalChartsProvider>
		);

		const { rerender } = render( <Harness /> );

		act( () => {
			contextValue.setSeriesVisibility( 'chart', 'Visitors', true );
		} );

		rerender( <Harness /> );

		expect( contextValue.isSeriesVisible( 'chart', 'Visitors' ) ).toBe( true );
	} );

	it( 'applies only the declared defaults after a remount', () => {
		// The provider stays mounted; only the chart unmounts and comes back, which
		// is the case where a stale hidden set would leak into the new mount.
		const Harness = ( { mounted }: { mounted: boolean } ) => (
			<GlobalChartsProvider>
				<Grab />
				{ mounted && <Chart defaults={ [ 'Visitors' ] } /> }
			</GlobalChartsProvider>
		);

		const { rerender } = render( <Harness mounted /> );

		act( () => {
			contextValue.setSeriesVisibility( 'chart', 'Views', false );
		} );
		expect( contextValue.isSeriesVisible( 'chart', 'Views' ) ).toBe( false );

		rerender( <Harness mounted={ false } /> );
		rerender( <Harness mounted /> );

		expect( contextValue.isSeriesVisible( 'chart', 'Visitors' ) ).toBe( false );
		expect( contextValue.isSeriesVisible( 'chart', 'Views' ) ).toBe( true );
	} );

	it( 'retains provider visibility when remounted without defaults', () => {
		const Harness = ( { defaults, mounted }: { defaults?: string[]; mounted: boolean } ) => (
			<GlobalChartsProvider>
				<Grab />
				{ mounted && <Chart defaults={ defaults } /> }
			</GlobalChartsProvider>
		);

		const { rerender } = render( <Harness defaults={ [ 'Visitors' ] } mounted /> );
		expect( contextValue.isSeriesVisible( 'chart', 'Visitors' ) ).toBe( false );

		rerender( <Harness mounted={ false } /> );
		rerender( <Harness mounted /> );

		expect( contextValue.isSeriesVisible( 'chart', 'Visitors' ) ).toBe( false );
	} );

	it( 'keeps the same set across renders until visibility changes', () => {
		// Charts memoize their rendered series off this set. A fresh identity per
		// render invalidates those memos, which re-runs the accessible tooltip's
		// effect and closes a tooltip the user is still navigating with.
		const Harness = () => (
			<GlobalChartsProvider>
				<Grab />
				<Chart defaults={ [ 'Visitors' ] } />
			</GlobalChartsProvider>
		);

		const { rerender } = render( <Harness /> );
		const seeded = resolvedHiddenSeries;

		rerender( <Harness /> );
		expect( resolvedHiddenSeries ).toBe( seeded );

		act( () => {
			contextValue.setSeriesVisibility( 'chart', 'Views', false );
		} );
		expect( resolvedHiddenSeries ).not.toBe( seeded );
	} );

	it( 're-seeds the defaults when chartId changes mid-mount', () => {
		// Same mount, only the chartId prop changes (e.g. <LineChart chartId={ metric } ... />
		// with `metric` going 'views' -> 'clicks'), so the component never unmounts.
		const Harness = ( { chartId }: { chartId: string } ) => (
			<GlobalChartsProvider>
				<Grab />
				<Chart chartId={ chartId } defaults={ [ 'Visitors' ] } />
			</GlobalChartsProvider>
		);

		const { rerender } = render( <Harness chartId="views" /> );

		expect( contextValue.isSeriesVisible( 'views', 'Visitors' ) ).toBe( false );

		rerender( <Harness chartId="clicks" /> );

		// The new chart id gets the same declared defaults seeded...
		expect( contextValue.isSeriesVisible( 'clicks', 'Visitors' ) ).toBe( false );
		// ...and the old id's hidden set is left as it was, not silently cleared.
		expect( contextValue.isSeriesVisible( 'views', 'Visitors' ) ).toBe( false );
	} );
} );
