/* eslint-disable testing-library/no-node-access, testing-library/no-container -- The avatar's images are decorative, so they have no role. */
import { fireEvent, render, screen } from '@testing-library/react';
import Avatar from '../avatar';

describe( 'Avatar', () => {
	it( 'is decorative beside a name, and an image with its own name when it stands alone', () => {
		const { container, rerender } = render( <Avatar name="Example Site" /> );
		expect( container.firstElementChild ).toHaveAttribute( 'aria-hidden', 'true' );
		expect( container.firstElementChild ).toHaveTextContent( 'E' );

		rerender( <Avatar name="Example Site" label="Example Site" /> );
		expect( screen.getByRole( 'img', { name: 'Example Site' } ) ).toBeInTheDocument();
	} );

	it( 'stacks the photo over the site icon over the initial, so each shows when the one above is missing', () => {
		const { container } = render(
			<Avatar
				name="hello@example.com"
				url="https://example.org/avatar?d=blank"
				fallbackUrl="https://example.org/icon.png"
			/>
		);
		const images = () => [ ...container.querySelectorAll( 'img' ) ].map( img => img.src );
		expect( images() ).toEqual( [
			'https://example.org/icon.png',
			'https://example.org/avatar?d=blank',
		] );

		fireEvent.error( container.querySelectorAll( 'img' )[ 1 ] );
		expect( images() ).toEqual( [ 'https://example.org/icon.png' ] );
		expect( container.firstElementChild ).toHaveTextContent( 'H' );
	} );
} );
