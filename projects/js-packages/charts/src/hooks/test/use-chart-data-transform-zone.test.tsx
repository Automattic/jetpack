import { render, screen } from '@testing-library/react';
import { GlobalChartsProvider } from '../../providers';
import { useChartDataTransform } from '../use-chart-data-transform';
import type { SeriesData } from '../../types';

// One reference, reused across both renders, so only the zone can invalidate the memo.
const data: SeriesData[] = [
	{ label: 'Series A', data: [ { dateString: '2026-08-02', value: 1 } ] },
];

const Probe = () => {
	const [ series ] = useChartDataTransform( data );
	const point = series.data[ 0 ] as { date?: Date };

	return <span data-testid="instant">{ point.date?.toISOString() }</span>;
};

describe( 'useChartDataTransform', () => {
	it( 're-dates its points when only the provider time zone changes', () => {
		const { rerender } = render(
			<GlobalChartsProvider timeZone="Asia/Tokyo">
				<Probe />
			</GlobalChartsProvider>
		);

		expect( screen.getByTestId( 'instant' ) ).toHaveTextContent( '2026-08-01T15:00:00.000Z' );

		rerender(
			<GlobalChartsProvider timeZone="Pacific/Auckland">
				<Probe />
			</GlobalChartsProvider>
		);

		expect( screen.getByTestId( 'instant' ) ).toHaveTextContent( '2026-08-01T12:00:00.000Z' );
	} );
} );
