/**
 * @jest-environment <rootDir>/tests/environment-los-angeles.mjs
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GlobalChartsProvider } from '../../../providers';
import LineChart, { renderDefaultTooltip } from '../line-chart';
import type { BucketInfo, DataPointDate } from '../../../types';
import type { RenderTooltipParams } from '../../../visx/types';

const mockRefCallback = jest.fn();
jest.mock( '../../../hooks/use-element-size', () => ( {
	useElementSize: () => [ mockRefCallback, 500, 300 ],
} ) );

const paramsFor = ( date: Date ) =>
	( {
		tooltipData: {
			nearestDatum: { key: 'Series A', datum: { date, value: 10 }, index: 0, distance: 0 },
			datumByKey: { 'Series A': { key: 'Series A', datum: { date, value: 10 }, index: 0 } },
		},
	} ) as unknown as RenderTooltipParams< DataPointDate >;

const HOURLY: BucketInfo = { bucket: 'hour', displayResolution: 'hour' };
const DAILY: BucketInfo = { bucket: 'day', displayResolution: 'day' };
const MONTHLY: BucketInfo = { bucket: 'month', displayResolution: 'month' };
const YEARLY: BucketInfo = { bucket: 'year', displayResolution: 'year' };

// 09:30 and 13:30 on the same Tokyo calendar day.
const morning = new Date( '2026-08-02T00:30:00Z' );
const afternoon = new Date( '2026-08-02T04:30:00Z' );

const headingFor = ( date: Date, bucketInfo?: BucketInfo, locale = 'en-US' ) => {
	const { container, unmount } = render(
		<GlobalChartsProvider locale={ locale } timeZone="Asia/Tokyo">
			{ renderDefaultTooltip( { ...paramsFor( date ), bucketInfo } ) }
		</GlobalChartsProvider>
	);
	const text = container.textContent ?? '';
	unmount();
	return text;
};

describe( 'default tooltip at hourly resolution', () => {
	it( 'distinguishes two hours of the same day', () => {
		expect( headingFor( morning, HOURLY ) ).not.toBe( headingFor( afternoon, HOURLY ) );
	} );

	it( 'names the hour in the host time zone', () => {
		// Full de-DE/Asia/Tokyo heading: pins the date style and the hour together.
		expect( headingFor( morning, HOURLY, 'de-DE' ) ).toContain( '2.8.2026, 09 Uhr' );
	} );

	it( 'keeps the day in the heading at month and year resolution', () => {
		expect( headingFor( morning, MONTHLY, 'de-DE' ) ).toContain( '2.8.2026' );
		expect( headingFor( morning, YEARLY, 'de-DE' ) ).toContain( '2.8.2026' );
	} );

	it( 'names no hour at daily resolution', () => {
		expect( headingFor( morning, DAILY ) ).not.toContain( 'AM' );
	} );

	it( 'renders as a date when no bucketInfo is supplied', () => {
		render(
			<GlobalChartsProvider locale="de-DE" timeZone="Asia/Tokyo">
				{ renderDefaultTooltip( paramsFor( new Date( '2026-08-02T15:30:00Z' ) ) ) }
			</GlobalChartsProvider>
		);

		expect( screen.getByText( '3.8.2026' ) ).toBeInTheDocument();
	} );

	it( 'reaches the tooltip an hourly chart opens', async () => {
		const user = userEvent.setup();
		render(
			<GlobalChartsProvider locale="de-DE" timeZone="Asia/Tokyo">
				<LineChart
					width={ 500 }
					height={ 300 }
					withGradientFill={ false }
					options={ { axis: { x: { tickResolution: 'hour' } } } }
					data={ [
						{
							label: 'Series A',
							data: [
								{ date: morning, value: 10 },
								{ date: afternoon, value: 20 },
							],
							options: {},
						},
					] }
				/>
			</GlobalChartsProvider>
		);

		screen.getByRole( 'grid', { name: /line chart/i } ).focus();
		await user.keyboard( '{ArrowRight}' );

		expect( screen.getByTestId( 'chart-tooltip-0' ) ).toHaveTextContent( '2.8.2026, 09 Uhr' );
	} );

	it( 'drops the hour once the hourly series is hidden, as the axis does', async () => {
		const user = userEvent.setup();
		render(
			<GlobalChartsProvider locale="de-DE" timeZone="Asia/Tokyo">
				<LineChart
					width={ 500 }
					height={ 300 }
					withGradientFill={ false }
					defaultHiddenSeries={ [ 'Hourly' ] }
					data={ [
						{
							label: 'Hourly',
							data: [
								{ date: morning, value: 10 },
								{ date: afternoon, value: 20 },
							],
							options: {},
						},
						{
							label: 'Daily',
							data: [
								{ date: morning, value: 5 },
								{ date: new Date( '2026-08-03T00:30:00Z' ), value: 6 },
							],
							options: {},
						},
					] }
				/>
			</GlobalChartsProvider>
		);

		screen.getByRole( 'grid', { name: /line chart/i } ).focus();
		await user.keyboard( '{ArrowRight}' );

		const tooltip = screen.getByTestId( 'chart-tooltip-0' );
		expect( tooltip ).toHaveTextContent( '2.8.2026' );
		expect( tooltip ).not.toHaveTextContent( 'Uhr' );
	} );
} );
