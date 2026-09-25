import { screen } from '@testing-library/react';
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import { GlobalChartsProvider } from '../global-charts-provider';
import { useDefaultHiddenSeries } from '../hooks/use-default-hidden-series';
import { useGlobalChartsContext } from '../hooks/use-global-charts-context';
import type { Root } from 'react-dom/client';

describe( 'useDefaultHiddenSeries paint timing', () => {
	let host: HTMLDivElement;
	let root: Root;
	let previousActEnvironment: boolean | undefined;

	beforeEach( () => {
		previousActEnvironment = globalThis.IS_REACT_ACT_ENVIRONMENT;
		globalThis.IS_REACT_ACT_ENVIRONMENT = false;
		host = document.createElement( 'div' );
		document.body.appendChild( host );
		root = createRoot( host );
	} );

	afterEach( () => {
		flushSync( () => root.unmount() );
		host.remove();
		globalThis.IS_REACT_ACT_ENVIRONMENT = previousActEnvironment;
	} );

	it( 'updates provider visibility before the first paint', () => {
		const Chart = () => {
			useDefaultHiddenSeries( 'chart', [ 'Visitors' ] );
			return null;
		};

		const Visibility = () => {
			const { isSeriesVisible } = useGlobalChartsContext();
			return (
				<span data-testid="series-visibility">
					{ isSeriesVisible( 'chart', 'Visitors' ) ? 'visible' : 'hidden' }
				</span>
			);
		};

		// flushSync lets us inspect the layout-effect result before a later passive
		// effect could seed the provider.
		flushSync( () => {
			root.render(
				<GlobalChartsProvider>
					<Chart />
					<Visibility />
				</GlobalChartsProvider>
			);
		} );

		expect( screen.getByTestId( 'series-visibility' ) ).toHaveTextContent( 'hidden' );
	} );
} );
