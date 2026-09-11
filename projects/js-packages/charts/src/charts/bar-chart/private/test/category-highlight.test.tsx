import { render, screen } from '@testing-library/react';
import { scaleBand } from '@visx/scale';
import { DataContext, TooltipContext } from '@visx/xychart';
import { useState } from 'react';
import { CATALOG_POINTERS } from '../../../../providers/chart-context/private/catalog-pointers';
import { CategoryHighlight } from '../category-highlight';
import type { CategoryHighlightSelection } from '../category-highlight';

const xScale = scaleBand( { domain: [ 'Jan', 'Feb' ], range: [ 10, 210 ] } );
const dataContext = {
	xScale,
	dataRegistry: { get: () => ( { xAccessor: datum => datum.label } ) },
	margin: { top: 20, left: 10 },
	innerWidth: 200,
	innerHeight: 150,
};

const Fixture = ( { label = 'Jan', onChange } ) => {
	return (
		<DataContext.Provider value={ dataContext as never }>
			<TooltipContext.Provider
				value={
					{
						tooltipOpen: true,
						tooltipData: { nearestDatum: { key: 'scores', datum: { label, value: 50 } } },
					} as never
				}
			>
				<svg>
					<CategoryHighlight visible horizontal={ false } onChange={ onChange } />
				</svg>
			</TooltipContext.Provider>
		</DataContext.Provider>
	);
};

it( 'uses the catalog surface fill with a terminal fallback', () => {
	render( <Fixture onChange={ undefined } /> );
	expect( screen.getByTestId( 'bar-chart-category-highlight' ) ).toHaveAttribute(
		'fill',
		CATALOG_POINTERS.surfaceSecondary
	);
	expect( CATALOG_POINTERS.surfaceSecondary ).toBe(
		'var(--a8c-charts-color-surface-secondary, #f4f4f4)'
	);
} );

it( 'settles inline derived-state callbacks and notifies the latest callback on selection changes', () => {
	const notify = jest.fn();
	const DerivedState = ( { label } ) => {
		const [ band, setBand ] = useState< { x: number } | null >( null );
		return (
			<>
				<output>{ band?.x }</output>
				<Fixture
					label={ label }
					// eslint-disable-next-line react/jsx-no-bind -- An inline callback reproduces parent state updates changing its identity.
					onChange={ ( selection: CategoryHighlightSelection | null ) => {
						notify( label );
						if ( notify.mock.calls.length > 4 ) {
							throw new Error( 'Highlight notifications did not settle' );
						}
						setBand( selection && { x: selection.x } );
					} }
				/>
			</>
		);
	};
	const { rerender } = render( <DerivedState label="Jan" /> );
	expect( screen.getByRole( 'status' ) ).toHaveTextContent( '10' );
	expect( notify ).toHaveBeenCalledTimes( 1 );
	rerender( <DerivedState label="Feb" /> );
	expect( screen.getByRole( 'status' ) ).toHaveTextContent( '110' );
	expect( notify ).toHaveBeenCalledTimes( 2 );
	expect( notify ).toHaveBeenLastCalledWith( 'Feb' );
} );
