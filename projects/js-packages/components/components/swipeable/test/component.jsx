import { jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import { Swipeable } from '../index';

describe( 'Swipeable', () => {
	const mockOnPageSelect = jest.fn();

	const renderSwipeable = ( props = {} ) => {
		render(
			<Swipeable onPageSelect={ mockOnPageSelect } { ...props }>
				<div key="page1">Page 1 Content</div>
				<div key="page2">Page 2 Content</div>
				<div key="page3">Page 3 Content</div>
			</Swipeable>
		);
	};

	beforeEach( () => {
		// Reset mock function before each test
		mockOnPageSelect.mockClear();
	} );

	it( 'renders all pages', () => {
		renderSwipeable();

		expect( screen.getByText( 'Page 1 Content' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Page 2 Content' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Page 3 Content' ) ).toBeInTheDocument();
	} );

	it( 'applies correct classes to pages based on currentPage', () => {
		renderSwipeable( { currentPage: 1 } );

		expect( screen.getByTestId( 'swipeable-page-1' ) ).toHaveClass( 'swipeable__page', 'is-prev' );
		expect( screen.getByTestId( 'swipeable-page-2' ) ).toHaveClass(
			'swipeable__page',
			'is-current'
		);
		expect( screen.getByTestId( 'swipeable-page-3' ) ).toHaveClass( 'swipeable__page', 'is-next' );
	} );

	it( 'applies custom className to pages', () => {
		renderSwipeable( { pageClassName: 'custom-page' } );

		expect( screen.getByTestId( 'swipeable-page-1' ) ).toHaveClass( 'custom-page' );
		expect( screen.getByTestId( 'swipeable-page-2' ) ).toHaveClass( 'custom-page' );
		expect( screen.getByTestId( 'swipeable-page-3' ) ).toHaveClass( 'custom-page' );
	} );

	it( 'handles dynamic height when enabled', () => {
		renderSwipeable( { hasDynamicHeight: true } );
		expect( screen.getByText( 'Page 1 Content' ) ).toBeInTheDocument();
	} );
} );
