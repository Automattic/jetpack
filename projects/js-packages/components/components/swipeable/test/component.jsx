import { jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import { Swipeable } from '../index';

describe( 'Swipeable', () => {
	const mockOnPageSelect = jest.fn();

	beforeEach( () => {
		mockOnPageSelect.mockClear();
	} );

	const renderSwipeable = ( props = {} ) => {
		render(
			<Swipeable onPageSelect={ mockOnPageSelect } { ...props }>
				<div key="page1">Page 1 Content</div>
				<div key="page2">Page 2 Content</div>
				<div key="page3">Page 3 Content</div>
			</Swipeable>
		);
	};

	it( 'renders all pages', () => {
		renderSwipeable();

		const elementPage1 = screen.getAllByText( 'Page 1 Content' );
		expect( elementPage1 ).toHaveLength( 2 ); // Clone first element at the end

		expect( screen.getByText( 'Page 2 Content' ) ).toBeInTheDocument();

		const elementPage3 = screen.getAllByText( 'Page 3 Content' );
		expect( elementPage3 ).toHaveLength( 2 ); // Clone last element at the beginning
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

	it( 'updates classes when currentPage changes', () => {
		const { rerender } = render(
			<Swipeable currentPage={ 0 }>
				<div key="page1">Page 1 Content</div>
				<div key="page2">Page 2 Content</div>
				<div key="page3">Page 3 Content</div>
			</Swipeable>
		);

		expect( screen.getByTestId( 'swipeable-page-1' ) ).toHaveClass(
			'swipeable__page',
			'is-current'
		);
		expect( screen.getByTestId( 'swipeable-page-2' ) ).toHaveClass( 'swipeable__page', 'is-next' );
		expect( screen.getByTestId( 'swipeable-page-3' ) ).toHaveClass( 'swipeable__page' );

		// Re-renderizar con currentPage = 1
		rerender(
			<Swipeable currentPage={ 1 }>
				<div key="page1">Page 1 Content</div>
				<div key="page2">Page 2 Content</div>
				<div key="page3">Page 3 Content</div>
			</Swipeable>
		);

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
} );
