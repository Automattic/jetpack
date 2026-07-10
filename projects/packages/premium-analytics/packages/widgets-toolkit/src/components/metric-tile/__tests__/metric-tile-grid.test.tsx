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
} );
