import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MediaFocalPoint from '../media-focal-point';

describe( 'MediaFocalPoint', () => {
	it( 'should render the picker with the image and the given point', () => {
		render(
			<MediaFocalPoint
				url="https://example.com/image.jpg"
				value={ { x: 0.25, y: 0.75 } }
				onChange={ jest.fn() }
			/>
		);

		expect( screen.getByRole( 'img' ) ).toHaveAttribute( 'src', 'https://example.com/image.jpg' );
		expect( screen.getByRole( 'spinbutton', { name: 'Focal point left position' } ) ).toHaveValue(
			25
		);
		expect( screen.getByRole( 'spinbutton', { name: 'Focal point top position' } ) ).toHaveValue(
			75
		);
	} );

	it( 'should call onChange with the rounded point when changed', async () => {
		const onChange = jest.fn();
		const user = userEvent.setup();

		render(
			<MediaFocalPoint
				url="https://example.com/image.jpg"
				value={ { x: 0.5, y: 0.5 } }
				onChange={ onChange }
			/>
		);

		const leftInput = screen.getByRole( 'spinbutton', { name: 'Focal point left position' } );
		await user.clear( leftInput );
		await user.type( leftInput, '75' );

		expect( onChange ).toHaveBeenLastCalledWith( { x: 0.75, y: 0.5 } );
	} );
} );
