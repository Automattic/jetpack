import { render, screen, within } from '@testing-library/react';
import ChannelAverageCard from '../channel-average-card';
import type { ChannelAverages, VideoStats } from '../../../types/stats';

const STATS: VideoStats = {
	views: { current: 100, previousPeriod: 80 },
	impressions: { current: 400, previousPeriod: 300 },
	watchTimeSeconds: { current: 7200, previousPeriod: 3600 },
	retentionRate: { current: 87.5, previousPeriod: 80 },
	series: [],
};

const CHANNEL: ChannelAverages = {
	videoCount: 4,
	views: 50.4,
	impressions: 200.6,
	watchTimeSeconds: 5400,
	retentionRate: 62.25,
};

describe( 'ChannelAverageCard', () => {
	it( 'renders one row per metric with this video and the channel average', () => {
		render( <ChannelAverageCard stats={ STATS } channel={ CHANNEL } isLoading={ false } /> );

		const table = screen.getByRole( 'table', { name: 'Compared to channel average' } );
		// Head row + four metric rows.
		expect( within( table ).getAllByRole( 'row' ) ).toHaveLength( 5 );

		const row = ( label: string ) =>
			within( table )
				.getAllByRole( 'row' )
				.find( r => within( r ).queryByText( label ) );

		expect( row( 'Views' ) ).toHaveTextContent( '100' );
		expect( row( 'Views' ) ).toHaveTextContent( '50' ); // 50.4 rounded
		expect( row( 'Impressions' ) ).toHaveTextContent( '400' );
		expect( row( 'Impressions' ) ).toHaveTextContent( '201' ); // 200.6 rounded
		expect( row( 'Watch time' ) ).toHaveTextContent( '2.0 h' );
		expect( row( 'Watch time' ) ).toHaveTextContent( '1.5 h' );
		expect( row( 'Retention' ) ).toHaveTextContent( '87.5%' );
		expect( row( 'Retention' ) ).toHaveTextContent( '62.3%' ); // one decimal
	} );

	it( 'replaces values with skeletons while loading', () => {
		render( <ChannelAverageCard stats={ STATS } channel={ CHANNEL } isLoading /> );

		expect( screen.queryByText( '87.5%' ) ).not.toBeInTheDocument();
		// Metric labels stay visible so the card keeps its shape.
		expect( screen.getByText( 'Views' ) ).toBeInTheDocument();
	} );
} );
