import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LineChart from '../../../charts/line-chart/line-chart';
import { GlobalChartsProvider } from '../../../providers';

jest.mock( '../../../hooks/use-element-size', () => ( {
	useElementSize: () => [ jest.fn(), 500, 300 ],
} ) );

// A real chart is the harness rather than the subject: the crosshairs only render once visx has a data context and an open tooltip, and `AccessibleTooltip` is where every xychart tooltip in this package goes through.
const chart = (
	<GlobalChartsProvider>
		<LineChart
			width={ 500 }
			height={ 300 }
			data={ [
				{
					label: 'Series A',
					data: [
						{ date: new Date( '2024-01-01' ), value: 10, label: 'Jan 1' },
						{ date: new Date( '2024-01-02' ), value: 20, label: 'Jan 2' },
					],
					options: {},
				},
			] }
			withTooltips
			withTooltipCrosshairs={ { showVertical: true } }
			withGradientFill={ false }
		/>
	</GlobalChartsProvider>
);

describe( 'AccessibleTooltip', () => {
	// visx renders each crosshair in a portal on `document.body`, outside the scope element that declares the catalog, so a `var()` chain handed to it there can only ever reach its own fallback rather than following the gridlines it tracks.
	it( 'gives the crosshair a resolved color rather than the catalog pointer', async () => {
		const user = userEvent.setup();

		render( chart );

		screen.getByRole( 'grid', { name: /line chart/i } ).focus();
		await user.keyboard( '{ArrowRight}' );

		// eslint-disable-next-line testing-library/no-node-access -- visx owns the crosshair and hardcodes its class name, so there is no attribute to reach it by.
		const crosshair = document.querySelector( '.visx-crosshair-vertical line' );

		expect( crosshair ).toHaveAttribute( 'stroke', '#dbdbdb' );
	} );
} );
