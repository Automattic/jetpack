import { fireEvent, render, screen } from '@testing-library/react';
import { mockRowLayout, scrollRowsToEnd } from '../../../../../tests/js/row-batches-test-utils';
import { useRowBatches } from '../use-row-batches';

/**
 * A stand-in for DataViews: one table row per row it was told to mount.
 *
 * @param props           - The harness props.
 * @param props.resetKey  - Passed through to the hook.
 * @param props.rowCount  - Passed through to the hook.
 * @param props.isLoading - Passed through to the hook.
 * @return The table.
 */
function Harness( {
	resetKey = 'a',
	rowCount = 1000,
	isLoading = false,
}: {
	resetKey?: string;
	rowCount?: number;
	isLoading?: boolean;
} ) {
	const { rowLimit, ref } = useRowBatches( rowCount, resetKey, isLoading );

	return (
		<div ref={ ref } data-testid="root" data-rows={ rowLimit }>
			<table>
				<tbody>
					{ Array.from( { length: Math.min( rowLimit, rowCount ) }, ( _, index ) => (
						<tr key={ index } />
					) ) }
				</tbody>
			</table>
		</div>
	);
}

describe( 'useRowBatches', () => {
	const { innerHeight } = window;

	beforeEach( mockRowLayout );

	afterEach( () => {
		window.innerHeight = innerHeight;
		jest.restoreAllMocks();
	} );

	it( 'keeps mounting batches until the rows reach past a tall window', () => {
		window.innerHeight = 4000;

		render( <Harness /> );

		expect( screen.getByTestId( 'root' ) ).toHaveAttribute( 'data-rows', '100' );
	} );

	it.each( [
		[ 'fewer rows than a batch', 20, '50' ],
		[ 'a batch and a half', 70, '100' ],
	] )( 'stops growing once every row is mounted: %s', ( _name, rowCount, rowLimit ) => {
		window.innerHeight = 4000;

		render( <Harness rowCount={ rowCount } /> );

		expect( screen.getByTestId( 'root' ) ).toHaveAttribute( 'data-rows', rowLimit );
	} );

	it( 'holds the fill while loading, then resumes', () => {
		window.innerHeight = 4000;
		const { rerender } = render( <Harness isLoading /> );
		expect( screen.getByTestId( 'root' ) ).toHaveAttribute( 'data-rows', '50' );

		rerender( <Harness /> );

		expect( screen.getByTestId( 'root' ) ).toHaveAttribute( 'data-rows', '100' );
	} );

	it( 'grows only once the page scrolls near the end of the rows', () => {
		render( <Harness /> );

		fireEvent.scroll( window );

		expect( screen.getByTestId( 'root' ) ).toHaveAttribute( 'data-rows', '50' );
	} );

	it( 'brings the table back into view on a new reset key', () => {
		const { rerender } = render( <Harness resetKey="a" /> );
		scrollRowsToEnd();
		expect( screen.getByTestId( 'root' ) ).toHaveAttribute( 'data-rows', '100' );

		rerender( <Harness resetKey="b" /> );

		expect( screen.getByTestId( 'root' ) ).toHaveAttribute( 'data-rows', '50' );
		expect( Element.prototype.scrollIntoView ).toHaveBeenCalledWith( { block: 'start' } );
	} );
} );
