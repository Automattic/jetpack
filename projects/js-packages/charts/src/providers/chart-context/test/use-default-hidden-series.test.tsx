import { render, act } from '@testing-library/react';
import { GlobalChartsProvider } from '../global-charts-provider';
import { useDefaultHiddenSeries } from '../hooks/use-default-hidden-series';
import { useGlobalChartsContext } from '../hooks/use-global-charts-context';
import type { GlobalChartsContextValue } from '../types';

describe( 'useDefaultHiddenSeries', () => {
	let contextValue: GlobalChartsContextValue;

	const Grab = () => {
		contextValue = useGlobalChartsContext();
		return null;
	};

	const Chart = ( { defaults }: { defaults?: string[] } ) => {
		useDefaultHiddenSeries( 'chart', defaults );
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
} );
