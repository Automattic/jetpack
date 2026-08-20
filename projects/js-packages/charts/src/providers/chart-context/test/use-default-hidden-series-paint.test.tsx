import { act, render } from '@testing-library/react';
import * as React from 'react';
import { GlobalChartsProvider } from '../global-charts-provider';
import { useDefaultHiddenSeries } from '../hooks/use-default-hidden-series';

// A jest.mock( 'react', ... ) factory affects every test in the file it lives in,
// so this test gets its own file rather than joining use-default-hidden-series.test.tsx.
jest.mock( 'react', () => {
	const actual = jest.requireActual( 'react' );
	return {
		...actual,
		useLayoutEffect: jest.fn( actual.useLayoutEffect ),
		useEffect: jest.fn( actual.useEffect ),
	};
} );

describe( 'useDefaultHiddenSeries paint timing', () => {
	it( 'seeds in a layout effect, not a passive one, so the series is hidden in the first painted frame', () => {
		const Chart = () => {
			useDefaultHiddenSeries( 'chart', [ 'Visitors' ] );
			return null;
		};

		// `mounted` lives on a component *inside* GlobalChartsProvider, not above it,
		// so toggling it only re-renders this subtree.
		let setMounted: ( mounted: boolean ) => void = () => {};
		const Toggle = () => {
			const [ mounted, mountedSetter ] = React.useState( false );
			setMounted = mountedSetter;
			return mounted ? <Chart /> : null;
		};

		render(
			<GlobalChartsProvider>
				<Toggle />
			</GlobalChartsProvider>
		);

		act( () => {
			setMounted( true );
		} );

		// GlobalChartsProvider has its own internal useLayoutEffect (for its color
		// cache, deps `[ providerTheme ]`) and, because seeding calls
		// `setChartHiddenSeries`, mounting the chart also causes the provider to
		// re-render and call that same hook again as a side effect — so counting
		// total useLayoutEffect calls can't isolate Chart's own effect. Instead,
		// identify the call by its actual signature: `useDefaultHiddenSeries` passes
		// deps `[ chartId, setChartHiddenSeries ]`, which is unique to it (the
		// provider's own effects use different deps shapes). Find that exact call
		// among both mocks to see which one it landed on.
		const isSeedingCall = ( call: unknown[] ) =>
			Array.isArray( call[ 1 ] ) && call[ 1 ][ 0 ] === 'chart' && call[ 1 ].length === 2;

		const layoutEffectMock = React.useLayoutEffect as jest.Mock;
		const effectMock = React.useEffect as jest.Mock;

		const seededViaLayoutEffect = layoutEffectMock.mock.calls.some( isSeedingCall );
		const seededViaPassiveEffect = effectMock.mock.calls.some( isSeedingCall );

		expect( seededViaLayoutEffect ).toBe( true );
		expect( seededViaPassiveEffect ).toBe( false );
	} );
} );
