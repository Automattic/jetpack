/**
 * External dependencies
 */
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { comment, postList } from '@wordpress/icons';
/**
 * Internal dependencies
 */
import { MetricTileGrid } from '../metric-tile-grid';

function renderMetricGrid() {
	return render(
		<MetricTileGrid
			tiles={ [
				{ key: 'posts', icon: postList, label: 'Posts', value: 1 },
				{ key: 'comments', icon: comment, label: 'Comments', value: 2 },
				{ key: 'words', icon: postList, label: 'Words', value: 3 },
				{ key: 'likes', icon: comment, label: 'Likes', value: null },
			] }
		/>
	);
}

describe( 'MetricTileGrid', () => {
	afterEach( () => jest.useRealTimers() );

	it( 'renders metric tiles as a list', () => {
		renderMetricGrid();

		expect( screen.getByRole( 'list' ) ).toBeInTheDocument();
		expect( screen.getAllByRole( 'listitem' ) ).toHaveLength( 4 );
		expect( screen.getByText( 'Posts' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Comments' ) ).toBeInTheDocument();
	} );

	it( 'marks the list with the layout picked for its box', () => {
		// jsdom lays nothing out, so the box measures 0x0: too short to stretch.
		renderMetricGrid();

		expect( screen.getByRole( 'list' ) ).toHaveAttribute( 'data-layout', 'compact' );
	} );

	it( 'renders the placeholder for null and non-finite values', () => {
		render(
			<MetricTileGrid
				tiles={ [
					{ key: 'open', label: 'Open rate', value: null },
					{ key: 'click', label: 'Click rate', value: NaN },
				] }
			/>
		);

		expect( screen.getAllByText( '—' ) ).toHaveLength( 2 );
	} );

	it( 'shows a period-over-period delta when a tile provides a previous value', () => {
		render(
			<MetricTileGrid
				tiles={ [ { key: 'views', label: 'Views', value: 150, previousValue: 100 } ] }
			/>
		);

		expect( screen.getByText( '150' ) ).toBeInTheDocument();
		expect( screen.getByText( /%/ ) ).toBeInTheDocument();
	} );

	it( 'renders the value without a delta when the previous value is null', () => {
		render(
			<MetricTileGrid
				tiles={ [ { key: 'views', label: 'Views', value: 150, previousValue: null } ] }
			/>
		);

		expect( screen.getByText( '150' ) ).toBeInTheDocument();
		expect( screen.queryByText( /%/ ) ).not.toBeInTheDocument();
	} );

	it( 'shows a tile note in a tooltip on the tile header', async () => {
		jest.useFakeTimers();
		const user = userEvent.setup( { advanceTimers: jest.advanceTimersByTime } );
		render(
			<MetricTileGrid
				tiles={ [
					{ key: 'visitors', label: 'Visitors', value: 3, note: 'Sum of daily visitors.' },
				] }
			/>
		);

		await user.hover( screen.getByText( 'Visitors' ) );
		await act( () => jest.runAllTimersAsync() );

		expect( screen.getByTestId( 'metric-note-tooltip' ) ).toHaveTextContent(
			'Sum of daily visitors.'
		);
	} );
} );
