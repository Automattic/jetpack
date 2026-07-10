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
			columns={ 2 }
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

	it.each( [
		{ columns: 0, tileCount: 4, expected: '1' },
		{ columns: 4, tileCount: 2, expected: '2' },
		{ columns: 3, tileCount: 0, expected: '3' },
	] )(
		'sets $expected grid columns for columns=$columns with $tileCount tiles',
		( { columns, tileCount, expected } ) => {
			const tiles = Array.from( { length: tileCount }, ( _, index ) => ( {
				key: `metric-${ index }`,
				label: `Metric ${ index }`,
				value: index,
			} ) );
			const { container } = render( <MetricTileGrid columns={ columns } tiles={ tiles } /> );

			expect(
				( container.firstElementChild as HTMLElement ).style.getPropertyValue(
					'--jpa-metric-tile-grid-columns'
				)
			).toBe( expected );
		}
	);
} );
