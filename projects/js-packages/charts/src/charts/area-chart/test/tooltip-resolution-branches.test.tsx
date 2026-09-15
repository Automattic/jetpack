/**
 * @jest-environment <rootDir>/tests/environment-los-angeles.mjs
 */
import { render, screen } from '@testing-library/react';
import { GlobalChartsProvider } from '../../../providers';
import AreaChart from '../area-chart';
import type { DataPointDate } from '../../../types';
import type { RenderTooltipParams } from '../../../visx/types';
import type { ReactNode } from 'react';

const mockRefCallback = jest.fn();
jest.mock( '../../../hooks/use-element-size', () => ( {
	useElementSize: () => [ mockRefCallback, 500, 300 ],
} ) );

// Captures AreaChart's `filteredRenderTooltip` so its early-return branch can be
// called directly: visx always sets `datumByKey` when it opens a tooltip.
type CapturedRenderTooltip = ( params: RenderTooltipParams< DataPointDate > ) => ReactNode;
let capturedRenderTooltip: CapturedRenderTooltip | undefined;
jest.mock( '../../../components/tooltip', () => ( {
	...jest.requireActual( '../../../components/tooltip' ),
	AccessibleTooltip: ( props: { renderTooltip?: CapturedRenderTooltip } ) => {
		capturedRenderTooltip = props.renderTooltip;
		return null;
	},
} ) );

// 09:30 on the Tokyo calendar day.
const morning = new Date( '2026-08-02T00:30:00Z' );

const datumA = { key: 'Series A', datum: { date: morning, value: 10 } as DataPointDate, index: 0 };
const datumB = { key: 'Series B', datum: { date: morning, value: 5 } as DataPointDate, index: 0 };

// Full de-DE/Asia/Tokyo heading for `morning`: pins the date style and the hour together.
const EXPECTED_HEADING = '2.8.2026, 09 Uhr';

const renderHourlyChart = ( defaultHiddenSeries?: string[] ) =>
	render(
		<GlobalChartsProvider locale="de-DE" timeZone="Asia/Tokyo">
			<AreaChart
				width={ 500 }
				height={ 300 }
				options={ { axis: { x: { tickResolution: 'hour' } } } }
				defaultHiddenSeries={ defaultHiddenSeries }
				data={ [
					{ label: 'Series A', data: [ datumA.datum ], options: {} },
					{ label: 'Series B', data: [ datumB.datum ], options: {} },
				] }
			/>
		</GlobalChartsProvider>
	);

const renderCaptured = ( params: RenderTooltipParams< DataPointDate > ) =>
	render(
		<GlobalChartsProvider locale="de-DE" timeZone="Asia/Tokyo">
			<div data-testid="captured-tooltip">{ capturedRenderTooltip!( params ) }</div>
		</GlobalChartsProvider>
	);

describe( "AreaChart's filteredRenderTooltip", () => {
	beforeEach( () => {
		capturedRenderTooltip = undefined;
	} );

	it( 'names the hour on the early-return path, before datumByKey exists', () => {
		renderHourlyChart();

		const params = {
			tooltipData: { nearestDatum: datumA, datumByKey: undefined },
		} as unknown as RenderTooltipParams< DataPointDate >;
		renderCaptured( params );

		expect( screen.getByTestId( 'captured-tooltip' ) ).toHaveTextContent( EXPECTED_HEADING );
	} );

	it( 'names the hour on the filtered path, with a hidden series', () => {
		renderHourlyChart( [ 'Series B' ] );

		const params = {
			tooltipData: { nearestDatum: datumA, datumByKey: { 'Series A': datumA, 'Series B': datumB } },
		} as unknown as RenderTooltipParams< DataPointDate >;
		renderCaptured( params );

		expect( screen.getByTestId( 'captured-tooltip' ) ).toHaveTextContent( EXPECTED_HEADING );
	} );
} );
