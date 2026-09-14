/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
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

	it( 'picks the grid for a two-column widget with room for every row', () => {
		jest.spyOn( HTMLElement.prototype, 'getBoundingClientRect' ).mockReturnValue( {
			width: 580,
			height: 326,
			top: 0,
			left: 0,
			right: 580,
			bottom: 326,
			x: 0,
			y: 0,
			toJSON: () => ( {} ),
		} );

		render(
			<div style={ { gridColumnEnd: 'span 2' } }>
				<MetricTileGrid
					tiles={ [
						{ key: 'posts', label: 'Posts', value: 1 },
						{ key: 'comments', label: 'Comments', value: 2 },
						{ key: 'words', label: 'Words', value: 3 },
						{ key: 'likes', label: 'Likes', value: 4 },
					] }
				/>
			</div>
		);

		expect( screen.getByRole( 'list' ) ).toHaveAttribute( 'data-layout', 'grid' );
		jest.restoreAllMocks();
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

	it( 'exposes a tile note as visually hidden assistive text', () => {
		render(
			<MetricTileGrid
				tiles={ [
					{ key: 'visitors', label: 'Visitors', value: 3, note: 'Sum of daily visitors.' },
				] }
			/>
		);

		expect( screen.getByText( 'Sum of daily visitors.' ) ).toBeInTheDocument();
	} );
} );
