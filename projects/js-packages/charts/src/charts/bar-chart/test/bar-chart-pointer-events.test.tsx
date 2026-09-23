import { render } from '@testing-library/react';
import { GlobalChartsProvider } from '../../../providers';
import BarChart from '../bar-chart';
const mockBandTooltip = jest.fn();
jest.mock( '../private/band-tooltip', () => ( {
	BandTooltip: props => {
		mockBandTooltip( props );
		return null;
	},
} ) );

const mockRefCallback = jest.fn();
jest.mock( '../../../hooks/use-element-size', () => ( {
	useElementSize: () => [ mockRefCallback, 500, 300 ],
} ) );

const DATA = [
	{
		label: 'Series A',
		data: [
			{ date: new Date( '2024-01-01' ), value: 10 },
			{ date: new Date( '2024-01-02' ), value: 20 },
		],
		options: {},
	},
];

/**
 * Render the chart with the recorder standing in for band pointer handling.
 *
 * @param props - Props layered onto the defaults.
 * @return The render result.
 */
function renderBarChart( props = {} ) {
	return render(
		<GlobalChartsProvider>
			<BarChart width={ 500 } height={ 300 } data={ DATA } { ...props } />
		</GlobalChartsProvider>
	);
}

describe( 'BarChart pointer events', () => {
	beforeEach( () => mockBandTooltip.mockClear() );

	test( 'routes pointer handlers through band correction without requiring tooltips', () => {
		const onPointerDown = jest.fn();
		const onPointerUp = jest.fn();

		renderBarChart( { onPointerDown, onPointerUp } );

		const props = mockBandTooltip.mock.calls.at( -1 )[ 0 ];
		expect( props.onPointerDown ).toBe( onPointerDown );
		expect( props.onPointerUp ).toBe( onPointerUp );
	} );
} );
