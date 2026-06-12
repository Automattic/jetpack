import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { usePostMeta } from '../../../hooks/use-post-meta';
import MediaFocalPoint from '../media-focal-point';

const mockUpdateImageFocalPoint = jest.fn();

jest.mock( '../../../hooks/use-post-meta', () => ( {
	usePostMeta: jest.fn(),
} ) );

describe( 'MediaFocalPoint', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		( usePostMeta as jest.Mock ).mockReturnValue( {
			imageFocalPoints: {},
			updateImageFocalPoint: mockUpdateImageFocalPoint,
		} );
	} );

	it( 'should render the picker with the image and a centered default point', () => {
		render( <MediaFocalPoint url="https://example.com/image.jpg" attachmentId={ 123 } /> );

		expect( screen.getByRole( 'img' ) ).toHaveAttribute( 'src', 'https://example.com/image.jpg' );
		expect( screen.getByRole( 'spinbutton', { name: 'Focal point left position' } ) ).toHaveValue(
			50
		);
		expect( screen.getByRole( 'spinbutton', { name: 'Focal point top position' } ) ).toHaveValue(
			50
		);
	} );

	it( 'should use the stored point of this image', () => {
		( usePostMeta as jest.Mock ).mockReturnValue( {
			imageFocalPoints: { 123: { x: 0.25, y: 0.75 } },
			updateImageFocalPoint: mockUpdateImageFocalPoint,
		} );

		render( <MediaFocalPoint url="https://example.com/image.jpg" attachmentId={ 123 } /> );

		expect( screen.getByRole( 'spinbutton', { name: 'Focal point left position' } ) ).toHaveValue(
			25
		);
		expect( screen.getByRole( 'spinbutton', { name: 'Focal point top position' } ) ).toHaveValue(
			75
		);
	} );

	it( 'should ignore points stored for other images', () => {
		( usePostMeta as jest.Mock ).mockReturnValue( {
			imageFocalPoints: { 999: { x: 0.25, y: 0.75 } },
			updateImageFocalPoint: mockUpdateImageFocalPoint,
		} );

		render( <MediaFocalPoint url="https://example.com/image.jpg" attachmentId={ 123 } /> );

		expect( screen.getByRole( 'spinbutton', { name: 'Focal point left position' } ) ).toHaveValue(
			50
		);
		expect( screen.getByRole( 'spinbutton', { name: 'Focal point top position' } ) ).toHaveValue(
			50
		);
	} );

	it( 'should commit the point for this image when changed', async () => {
		const user = userEvent.setup();

		render( <MediaFocalPoint url="https://example.com/image.jpg" attachmentId={ 123 } /> );

		const leftInput = screen.getByRole( 'spinbutton', { name: 'Focal point left position' } );
		await user.clear( leftInput );
		await user.type( leftInput, '75' );

		expect( mockUpdateImageFocalPoint ).toHaveBeenLastCalledWith( 123, {
			x: 0.75,
			y: 0.5,
		} );
	} );
} );
