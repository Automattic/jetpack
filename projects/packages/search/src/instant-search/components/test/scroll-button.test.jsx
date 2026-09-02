import { render, screen } from '@testing-library/react';
import { SEARCH_RESULTS_CLASS_NAME } from '../../lib/constants';
import ScrollButton from '../scroll-button';

const defaultProps = {
	enableLoadOnScroll: true,
	isLoading: false,
	onLoadNextPage: () => {},
};

/**
 * Adds the results container that ScrollButton attaches its scroll listener to.
 *
 * @return {HTMLElement} The results container.
 */
function addResultsContainer() {
	const results = document.createElement( 'div' );
	results.className = SEARCH_RESULTS_CLASS_NAME;
	document.body.appendChild( results );
	return results;
}

describe( 'ScrollButton', () => {
	beforeEach( () => {
		document.body.innerHTML = '';
		jest.useFakeTimers();
	} );

	afterEach( () => {
		jest.useRealTimers();
	} );

	it( 'removes the scroll listener it added once unmounted', () => {
		const results = addResultsContainer();
		const addEventListener = jest.spyOn( results, 'addEventListener' );
		const removeEventListener = jest.spyOn( results, 'removeEventListener' );

		const { unmount } = render( <ScrollButton { ...defaultProps } /> );
		expect( addEventListener ).toHaveBeenCalledWith( 'scroll', expect.any( Function ) );

		unmount();
		expect( removeEventListener ).toHaveBeenCalledWith(
			'scroll',
			addEventListener.mock.calls[ 0 ][ 1 ]
		);
	} );

	it( 'loads the next page when the results are scrolled to the bottom', () => {
		const results = addResultsContainer();
		const onLoadNextPage = jest.fn();
		render( <ScrollButton { ...defaultProps } onLoadNextPage={ onLoadNextPage } /> );

		results.dispatchEvent( new Event( 'scroll' ) );
		jest.runAllTimers();

		expect( onLoadNextPage ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'does not load another page from a scroll that lands just before unmount', () => {
		const results = addResultsContainer();
		const onLoadNextPage = jest.fn();
		const { unmount } = render(
			<ScrollButton { ...defaultProps } onLoadNextPage={ onLoadNextPage } />
		);

		results.dispatchEvent( new Event( 'scroll' ) );
		unmount();
		jest.runAllTimers();

		expect( onLoadNextPage ).not.toHaveBeenCalled();
	} );

	it( 'renders and unmounts cleanly when the results container is missing', () => {
		const { unmount } = render( <ScrollButton { ...defaultProps } /> );

		expect( screen.getByRole( 'button', { name: 'Load more' } ) ).toBeInTheDocument();
		expect( () => unmount() ).not.toThrow();
	} );
} );
