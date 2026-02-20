import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MediaPreview from '../media-preview';

describe( 'MediaPreview', () => {
	const defaultMedia = {
		id: 123,
		url: 'https://example.com/image.jpg',
		type: 'image' as const,
	};

	const mockOnReplace = jest.fn();
	const mockOnRemove = jest.fn();

	beforeEach( () => {
		jest.clearAllMocks();
	} );

	it( 'should return null when no media and not loading', () => {
		const { container } = render(
			<MediaPreview media={ null } onReplace={ mockOnReplace } onRemove={ mockOnRemove } />
		);

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'should render image preview for image media', () => {
		render(
			<MediaPreview media={ defaultMedia } onReplace={ mockOnReplace } onRemove={ mockOnRemove } />
		);

		const img = screen.getByRole( 'img' );
		expect( img ).toBeInTheDocument();
		expect( img ).toHaveAttribute( 'src', defaultMedia.url );
	} );

	it( 'should render video preview for video media', () => {
		const videoMedia = {
			id: 456,
			url: 'https://example.com/video.mp4',
			type: 'video' as const,
		};

		render(
			<MediaPreview media={ videoMedia } onReplace={ mockOnReplace } onRemove={ mockOnRemove } />
		);

		// When video media is passed, no img element should be rendered
		expect( screen.queryByRole( 'img' ) ).not.toBeInTheDocument();

		// But the action buttons should still be available
		expect( screen.getByRole( 'button', { name: 'Replace' } ) ).toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: 'Remove' } ) ).toBeInTheDocument();
	} );

	it( 'should not show media preview when loading but show buttons', () => {
		render(
			<MediaPreview
				media={ defaultMedia }
				isLoading={ true }
				onReplace={ mockOnReplace }
				onRemove={ mockOnRemove }
			/>
		);

		// When loading, the image should not be visible
		expect( screen.queryByRole( 'img' ) ).not.toBeInTheDocument();
		// But the action buttons should still be shown so user can change selection
		expect( screen.getByRole( 'button', { name: 'Replace' } ) ).toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: 'Remove' } ) ).toBeInTheDocument();
	} );

	it( 'should render Replace and Remove buttons', () => {
		render(
			<MediaPreview media={ defaultMedia } onReplace={ mockOnReplace } onRemove={ mockOnRemove } />
		);

		expect( screen.getByRole( 'button', { name: 'Replace' } ) ).toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: 'Remove' } ) ).toBeInTheDocument();
	} );

	it( 'should call onReplace when Replace button is clicked', async () => {
		const user = userEvent.setup();

		render(
			<MediaPreview media={ defaultMedia } onReplace={ mockOnReplace } onRemove={ mockOnRemove } />
		);

		await user.click( screen.getByRole( 'button', { name: 'Replace' } ) );

		expect( mockOnReplace ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'should call onRemove when Remove button is clicked', async () => {
		const user = userEvent.setup();

		render(
			<MediaPreview media={ defaultMedia } onReplace={ mockOnReplace } onRemove={ mockOnRemove } />
		);

		await user.click( screen.getByRole( 'button', { name: 'Remove' } ) );

		expect( mockOnRemove ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'should disable buttons when disabled prop is true', () => {
		render(
			<MediaPreview
				media={ defaultMedia }
				onReplace={ mockOnReplace }
				onRemove={ mockOnRemove }
				disabled={ true }
			/>
		);

		expect( screen.getByRole( 'button', { name: 'Replace' } ) ).toBeDisabled();
		expect( screen.getByRole( 'button', { name: 'Remove' } ) ).toBeDisabled();
	} );

	it( 'should show buttons when loading', () => {
		render(
			<MediaPreview
				media={ defaultMedia }
				isLoading={ true }
				onReplace={ mockOnReplace }
				onRemove={ mockOnRemove }
			/>
		);

		// Buttons should be visible during loading so user can change selection if API fails
		expect( screen.getByRole( 'button', { name: 'Replace' } ) ).toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: 'Remove' } ) ).toBeInTheDocument();
	} );
} );
