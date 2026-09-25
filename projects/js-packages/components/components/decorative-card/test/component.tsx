import { render, screen } from '@testing-library/react';
import DecorativeCard from '../index.tsx';

describe( 'DecorativeCard', () => {
	it( 'hides the whole card from the accessibility tree', () => {
		render( <DecorativeCard /> );
		expect( screen.getByTestId( 'decorative-card' ) ).toHaveAttribute( 'aria-hidden', 'true' );
	} );

	it( 'defaults to the horizontal format', () => {
		render( <DecorativeCard /> );
		expect( screen.getByTestId( 'decorative-card' ) ).toHaveClass(
			'jp-components__decorative-card--horizontal'
		);
	} );

	it( 'applies the vertical format class', () => {
		render( <DecorativeCard format="vertical" /> );
		expect( screen.getByTestId( 'decorative-card' ) ).toHaveClass(
			'jp-components__decorative-card--vertical'
		);
	} );

	it( 'merges a consumer class name and passes extra props through', () => {
		render( <DecorativeCard className="sample-classname" id="my-card" /> );
		const card = screen.getByTestId( 'decorative-card' );
		expect( card ).toHaveClass( 'jp-components__decorative-card', 'sample-classname' );
		expect( card ).toHaveAttribute( 'id', 'my-card' );
	} );

	it( 'renders no icon by default', () => {
		render( <DecorativeCard /> );
		expect( screen.queryByTestId( 'decorative-card_icon' ) ).not.toBeInTheDocument();
	} );

	it( 'renders the unlink glyph when asked', () => {
		render( <DecorativeCard icon="unlink" /> );
		expect( screen.getByTestId( 'decorative-card_icon' ) ).toBeInTheDocument();
	} );

	it( 'sets no background image when no image URL is given', () => {
		render( <DecorativeCard /> );
		// The absence of the attribute is the assertion: the component passes
		// `undefined`, so React omits `style` entirely. `toHaveStyle` cannot
		// express this — it treats an empty expected value as always matching.
		expect( screen.getByTestId( 'decorative-card_image' ) ).not.toHaveAttribute( 'style' );
	} );

	it( 'sets the background image from the image URL', () => {
		render( <DecorativeCard imageUrl="image.jpg" /> );
		expect( screen.getByTestId( 'decorative-card_image' ) ).toHaveStyle( {
			backgroundImage: 'url(image.jpg)',
		} );
	} );
} );
