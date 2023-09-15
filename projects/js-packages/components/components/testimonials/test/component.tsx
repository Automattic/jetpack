import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Testimonials from '../index';
import { Testimonial } from '../testimonial';

const testimonials = [
	{
		quote: 'This is a quote',
		author: 'John Doe',
		profession: 'CEO',
		img: 'https://via.placeholder.com/150',
	},
	{
		quote: 'This is another quote',
		author: 'Jane Doe',
		profession: 'CTO',
		img: 'https://via.placeholder.com/149',
	},
	{
		quote: 'This is yet another quote',
		author: 'Mary Doe',
		profession: 'CFO',
		img: 'https://via.placeholder.com/148',
	},
];

describe( 'Testimonial', () => {
	it( 'should render the testimonial', () => {
		const { quote, author, profession } = testimonials[ 0 ];

		render( <Testimonial { ...testimonials[ 0 ] } hidden={ false } /> );

		expect( screen.getByText( `“${ quote }”` ) ).toBeInTheDocument();
		expect( screen.getByText( author ) ).toBeInTheDocument();
		expect( screen.getByText( profession ) ).toBeInTheDocument();
		expect( screen.getByAltText( author ) ).toBeInTheDocument();
	} );
} );

describe( 'Testimonials', () => {
	it( 'should render the first testimonial on load', () => {
		const { quote, author, profession } = testimonials[ 0 ];
		render( <Testimonials testimonials={ testimonials } /> );

		expect( screen.getByText( `“${ quote }”` ) ).toBeInTheDocument();
		expect( screen.getByText( author ) ).toBeInTheDocument();
		expect( screen.getByText( profession ) ).toBeInTheDocument();
		expect( screen.getByAltText( author ) ).toBeInTheDocument();
	} );

	it( 'should render the next testimonial when the right arrow is clicked', async () => {
		const { author: secondAuthor } = testimonials[ 1 ];

		render( <Testimonials testimonials={ testimonials } /> );

		const rightArrow = screen.getByTestId( 'right-arrow' );
		await userEvent.click( rightArrow );

		expect( screen.getByText( secondAuthor ) ).toBeInTheDocument();

		await userEvent.click( rightArrow );

		const { author: thirdAuthor } = testimonials[ 2 ];

		expect( screen.getByText( thirdAuthor ) ).toBeInTheDocument();

		await userEvent.click( rightArrow );

		const { author } = testimonials[ 0 ];

		expect( screen.getByText( author ) ).toBeInTheDocument();
	} );

	it( 'should render the previous testimonial when the left arrow is clicked', async () => {
		const { author: thirdAuthor } = testimonials[ 2 ];

		render( <Testimonials testimonials={ testimonials } /> );

		const leftArrow = screen.getByTestId( 'left-arrow' );
		await userEvent.click( leftArrow );

		expect( screen.getByText( thirdAuthor ) ).toBeInTheDocument();

		await userEvent.click( leftArrow );

		const { author: secondAuthor } = testimonials[ 1 ];

		expect( screen.getByText( secondAuthor ) ).toBeInTheDocument();

		await userEvent.click( leftArrow );

		const { author } = testimonials[ 0 ];

		expect( screen.getByText( author ) ).toBeInTheDocument();
	} );

	it( 'should not render the arrows if there is only one testimonial', () => {
		render( <Testimonials testimonials={ [ testimonials[ 0 ] ] } /> );

		expect( screen.queryByTestId( 'left-arrow' ) ).not.toBeInTheDocument();
		expect( screen.queryByTestId( 'right-arrow' ) ).not.toBeInTheDocument();
	} );
} );
