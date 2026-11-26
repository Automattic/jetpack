import { render, screen } from '@testing-library/react';
import { mockRowLayout, scrollRowsToEnd } from '../../../../../tests/js/row-batches-test-utils';
import { useRowBatches } from '../use-row-batches';

/**
 * A stand-in for DataViews: one table row per row it was told to mount.
 *
 * @param props          - The harness props.
 * @param props.resetKey - Passed through to the hook.
 * @return The table.
 */
function Harness( { resetKey = 'a' }: { resetKey?: string } ) {
	const { rowLimit, ref } = useRowBatches( 1000, resetKey );

	return (
		<div ref={ ref } data-testid="root" data-rows={ rowLimit }>
			<table>
				<tbody>
					{ Array.from( { length: rowLimit }, ( _, index ) => (
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

	it( 'brings the table back into view on a new reset key', () => {
		const { rerender } = render( <Harness resetKey="a" /> );
		scrollRowsToEnd();
		expect( screen.getByTestId( 'root' ) ).toHaveAttribute( 'data-rows', '100' );

		rerender( <Harness resetKey="b" /> );

		expect( screen.getByTestId( 'root' ) ).toHaveAttribute( 'data-rows', '50' );
		expect( Element.prototype.scrollIntoView ).toHaveBeenCalledWith( { block: 'start' } );
	} );
} );
