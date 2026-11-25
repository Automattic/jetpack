import { render, screen } from '@testing-library/react';
import { useRowBatches } from '../use-row-batches';

const ROW_HEIGHT = 48;

/**
 * A stand-in for DataViews: a scroll container as tall as the rows it was told to mount.
 *
 * @param props          - The harness props.
 * @param props.resetKey - Passed through to the hook.
 * @return The container.
 */
function Harness( { resetKey = 'a' }: { resetKey?: string } ) {
	const { rowLimit, containerProps } = useRowBatches( 1000, resetKey );

	return (
		<div { ...containerProps }>
			<div className="dataviews-layout__container" data-testid="container" data-rows={ rowLimit } />
		</div>
	);
}

describe( 'useRowBatches', () => {
	beforeEach( () => {
		jest.spyOn( Element.prototype, 'scrollHeight', 'get' ).mockImplementation( function (
			this: Element
		) {
			return Number( this.getAttribute( 'data-rows' ) ) * ROW_HEIGHT;
		} );
	} );

	afterEach( () => {
		jest.restoreAllMocks();
	} );

	it( 'keeps mounting batches until the rows overflow a tall container', () => {
		jest.spyOn( Element.prototype, 'clientHeight', 'get' ).mockReturnValue( 4000 );

		render( <Harness /> );

		expect( screen.getByTestId( 'container' ) ).toHaveAttribute( 'data-rows', '100' );
	} );

	it( 'scrolls the container back to the top on a new reset key', () => {
		jest.spyOn( Element.prototype, 'clientHeight', 'get' ).mockReturnValue( 800 );
		const setScrollTop = jest.spyOn( Element.prototype, 'scrollTop', 'set' );
		const { rerender } = render( <Harness resetKey="a" /> );
		setScrollTop.mockClear();

		rerender( <Harness resetKey="b" /> );

		expect( setScrollTop ).toHaveBeenCalledWith( 0 );
	} );
} );
