import { render } from '@testing-library/react';
import { GlobalChartsProvider } from '../../../providers';
import BarChart from '../bar-chart';
import type { ReactNode } from 'react';

// jsdom gives every element a zero-sized box, so visx can never resolve a
// pointer to a datum here. Standing `XYChart` in for a prop recorder keeps this
// test on the part jsdom can answer: that the handlers reach the chart at all.
// Whether a bar then reports the datum under the pointer is a browser question.
const mockXYChart = jest.fn();
jest.mock( '@visx/xychart', () => {
	const actual = jest.requireActual( '@visx/xychart' );

	return {
		__esModule: true,
		...actual,
		XYChart: ( props: { children?: ReactNode } ) => {
			mockXYChart( props );
			return <svg />;
		},
	};
} );

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
 * Render the chart with the recorder standing in for `XYChart`.
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
	beforeEach( () => mockXYChart.mockClear() );

	test( 'hands the pointer handlers to the chart, so a bar can be clicked', () => {
		const onPointerDown = jest.fn();
		const onPointerUp = jest.fn();

		renderBarChart( { onPointerDown, onPointerUp } );

		const props = mockXYChart.mock.calls.at( -1 )[ 0 ];
		expect( props.onPointerDown ).toBe( onPointerDown );
		expect( props.onPointerUp ).toBe( onPointerUp );
	} );

	test( 'resolves pointer events to the nearest datum', () => {
		renderBarChart();

		expect( mockXYChart.mock.calls.at( -1 )[ 0 ].pointerEventsDataKey ).toBe( 'nearest' );
	} );
} );
