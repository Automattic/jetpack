/** @jest-environment node */

import { renderToStaticMarkup } from 'react-dom/server';
import { useDefaultHiddenSeries } from '../hooks/use-default-hidden-series';

const mockGetHiddenSeries = jest.fn( () => new Set( [ 'Provider hidden' ] ) );
const mockSetChartHiddenSeries = jest.fn();

jest.mock( '../hooks/use-global-charts-context', () => ( {
	useGlobalChartsContext: () => ( {
		getHiddenSeries: mockGetHiddenSeries,
		setChartHiddenSeries: mockSetChartHiddenSeries,
	} ),
} ) );

describe( 'useDefaultHiddenSeries SSR', () => {
	it( 'applies defaults to the server-rendered output before effects run', () => {
		const Chart = () => {
			const hiddenSeries = useDefaultHiddenSeries( 'chart', [ 'Visitors' ] );

			return (
				<>
					{ [ 'Visitors', 'Views' ].map( label =>
						! hiddenSeries.has( label ) ? <span key={ label }>{ label }</span> : null
					) }
				</>
			);
		};

		const view = renderToStaticMarkup( <Chart /> );

		expect( view ).not.toContain( 'Visitors' );
		expect( view ).toContain( 'Views' );
		expect( mockGetHiddenSeries ).not.toHaveBeenCalled();
		expect( mockSetChartHiddenSeries ).not.toHaveBeenCalled();
	} );
} );
