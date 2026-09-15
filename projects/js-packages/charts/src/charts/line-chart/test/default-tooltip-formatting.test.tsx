/**
 * @jest-environment <rootDir>/tests/environment-los-angeles.mjs
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GlobalChartsProvider } from '../../../providers';
import LineChart, { renderDefaultTooltip } from '../line-chart';
import type { DataPointDate } from '../../../types';
import type { RenderTooltipParams } from '../../../visx/types';

const mockRefCallback = jest.fn();
jest.mock( '../../../hooks/use-element-size', () => ( {
	useElementSize: () => [ mockRefCallback, 500, 300 ],
} ) );

// The instant below is Aug 2 in Los Angeles and Aug 3 in Tokyo, so a tooltip
// that reads the runtime zone prints a different day from the axis.

const date = new Date( '2026-08-02T15:30:00Z' );

const params = {
	tooltipData: {
		nearestDatum: { key: 'Series A', datum: { date, value: 10 }, index: 0, distance: 0 },
		datumByKey: { 'Series A': { key: 'Series A', datum: { date, value: 10 }, index: 0 } },
	},
} as unknown as RenderTooltipParams< DataPointDate >;

describe( 'renderDefaultTooltip date heading', () => {
	it( 'uses the locale and time zone from the provider', () => {
		render(
			<GlobalChartsProvider locale="de-DE" timeZone="Asia/Tokyo">
				{ renderDefaultTooltip( params ) }
			</GlobalChartsProvider>
		);

		expect( screen.getByText( '3.8.2026' ) ).toBeInTheDocument();
	} );

	it( 'falls back to the runtime locale and zone when the provider supplies none', () => {
		render( <GlobalChartsProvider>{ renderDefaultTooltip( params ) }</GlobalChartsProvider> );

		expect( screen.getByText( '8/2/2026' ) ).toBeInTheDocument();
	} );

	// The tooltip renders through a portal, so this is the only check that the
	// provider's context actually reaches it inside a real chart.
	it( 'reaches the tooltip a mounted chart opens', async () => {
		const user = userEvent.setup();
		render(
			<GlobalChartsProvider locale="de-DE" timeZone="Asia/Tokyo">
				<LineChart
					width={ 500 }
					height={ 300 }
					withGradientFill={ false }
					data={ [
						{
							label: 'Series A',
							data: [
								{ date, value: 10 },
								{ date: new Date( date.getTime() + 24 * 60 * 60 * 1000 ), value: 20 },
							],
							options: {},
						},
					] }
				/>
			</GlobalChartsProvider>
		);

		screen.getByRole( 'grid', { name: /line chart/i } ).focus();
		await user.keyboard( '{ArrowRight}' );

		expect( screen.getByTestId( 'chart-tooltip-0' ) ).toHaveTextContent( '3.8.2026' );
	} );
} );
