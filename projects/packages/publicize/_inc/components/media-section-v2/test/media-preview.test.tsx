import { render, screen } from '@testing-library/react';
import MediaPreview from '../media-preview';

describe( 'MediaPreview', () => {
	const defaultMedia = {
		id: 123,
		url: 'https://example.com/image.jpg',
		type: 'image' as const,
	};

	it( 'should return null when no media and not loading', () => {
		const { container } = render( <MediaPreview media={ null } /> );

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'should render image preview for image media', () => {
		render( <MediaPreview media={ defaultMedia } /> );

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

		render( <MediaPreview media={ videoMedia } /> );

		expect( screen.queryByRole( 'img' ) ).not.toBeInTheDocument();
	} );

	it( 'should not show media preview when loading', () => {
		render( <MediaPreview media={ defaultMedia } isLoading={ true } /> );

		expect( screen.queryByRole( 'img' ) ).not.toBeInTheDocument();
	} );

	it( 'should render spinner when loading with no media', () => {
		const { container } = render( <MediaPreview media={ null } isLoading={ true } /> );

		expect( container ).not.toBeEmptyDOMElement();
	} );
} );
