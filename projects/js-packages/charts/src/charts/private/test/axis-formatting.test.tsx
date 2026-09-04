/**
 * @jest-environment <rootDir>/tests/environment-los-angeles.mjs
 */
import { render, screen } from '@testing-library/react';
import { GlobalChartsProvider } from '../../../providers';
import AreaChart from '../../area-chart/area-chart';
import BarChart from '../../bar-chart/bar-chart';
import LineChart from '../../line-chart/line-chart';
import type { ReactNode } from 'react';

const mockRefCallback = jest.fn();
jest.mock( '../../../hooks/use-element-size', () => ( {
	useElementSize: () => [ mockRefCallback, 500, 300 ],
} ) );

// 15:30 UTC is Aug 2 in the runtime zone and Aug 3 in Tokyo.
const START = Date.parse( '2026-08-02T15:30:00Z' );

const data = [
	{
		label: 'Series A',
		data: Array.from( { length: 14 }, ( _, i ) => ( {
			date: new Date( START + i * 24 * 60 * 60 * 1000 ),
			value: 10 + i,
		} ) ),
		options: {},
	},
];

const size = { width: 500, height: 300 };

// Every axis labels the data's own buckets, so the fallback names the first
// point's runtime-zone day rather than a round-numbered instant near it.
const RUNTIME_TICK = 'Aug 2';

const charts: [ string, ReactNode ][] = [
	[ 'AreaChart', <AreaChart key="a" { ...size } data={ data } /> ],
	[ 'BarChart', <BarChart key="b" { ...size } data={ data } /> ],
	[ 'LineChart', <LineChart key="l" { ...size } data={ data } withGradientFill={ false } /> ],
];

describe.each( charts )( '%s x axis', ( _name, chart ) => {
	const renderIn = ( props: { locale?: string; timeZone?: string } ) =>
		render( <GlobalChartsProvider { ...props }>{ chart }</GlobalChartsProvider> );

	it( "labels ticks in the provider's locale", () => {
		renderIn( { locale: 'de-DE', timeZone: 'Asia/Tokyo' } );

		expect( screen.getByText( '3. Aug.' ) ).toBeInTheDocument();
	} );

	it( 'falls back to the runtime locale and zone when the provider supplies none', () => {
		renderIn( {} );

		expect( screen.getByText( RUNTIME_TICK ) ).toBeInTheDocument();
	} );

	it( 'relabels when the provider swaps time zone', () => {
		const { rerender } = render(
			<GlobalChartsProvider timeZone="Asia/Tokyo">{ chart }</GlobalChartsProvider>
		);

		expect( screen.getByText( 'Aug 3' ) ).toBeInTheDocument();

		rerender( <GlobalChartsProvider timeZone="Pacific/Honolulu">{ chart }</GlobalChartsProvider> );

		expect( screen.getByText( 'Aug 2' ) ).toBeInTheDocument();
	} );
} );

// The values WordPress hands out: `get_locale()` is `en_US`, and `timezone_string`
// is empty on a site set to a raw UTC offset. Unsanitized, `Intl` throws during
// render and React unmounts the host tree rather than one chart.
describe( 'a host locale and zone Intl cannot use', () => {
	it( 'still renders, in the runtime zone, and warns', () => {
		render(
			<GlobalChartsProvider locale="en_US" timeZone="">
				<BarChart { ...size } data={ data } />
			</GlobalChartsProvider>
		);

		expect( screen.getByText( 'Aug 2' ) ).toBeInTheDocument();
		expect( console ).toHaveWarned();
	} );
} );
