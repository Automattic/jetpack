import { render, screen } from '@testing-library/react';
import GalleryImageSave from '../save';

jest.mock( '@wordpress/blob', () => ( {
	isBlobURL: jest.fn( () => false ),
} ) );

jest.mock( '@wordpress/block-editor', () => ( {
	...jest.requireActual( '@wordpress/block-editor' ),
	useBlockProps: jest.fn(),
} ) );

const mockIsSimpleSite = jest.fn();

jest.mock( '@automattic/jetpack-script-data', () => ( {
	isSimpleSite: () => mockIsSimpleSite(),
} ) );

const mockRender = jest.fn();

jest.mock( '@wordpress/element', () => {
	const actualElement = jest.requireActual( '@wordpress/element' );
	return {
		...actualElement,
		createRoot: () => ( {
			render: mockRender,
		} ),
		memo: component => component,
	};
} );

const defaultProps = {
	alt: 'Test image',
	imageFilter: 'grayscale',
	height: 300,
	id: 123,
	link: 'http://example.com/attachment',
	linkTo: 'attachment',
	customLink: '',
	origUrl: 'http://example.com/image.jpg',
	url: 'http://example.com/image.jpg',
	width: 400,
};

describe( 'Gallery Image Save', () => {
	beforeEach( () => {
		document.body.innerHTML = '';
		jest.clearAllMocks();
	} );

	it( 'renders image with data-amp-layout when not a simple site', () => {
		mockIsSimpleSite.mockReturnValue( false );
		const { container } = render( <GalleryImageSave { ...defaultProps } /> );
		expect( container.innerHTML ).toContain( 'data-amp-layout="responsive"' );
	} );

	it( 'renders image without data-amp-layout when a simple site', () => {
		mockIsSimpleSite.mockReturnValue( true );
		const { container } = render( <GalleryImageSave { ...defaultProps } /> );
		expect( container.innerHTML ).not.toContain( 'data-amp-layout' );
	} );

	it( 'handles blob URLs by returning null', () => {
		jest.requireMock( '@wordpress/blob' ).isBlobURL.mockReturnValueOnce( true );
		const { container } = render( <GalleryImageSave { ...defaultProps } /> );
		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'renders image with custom link', () => {
		const props = {
			...defaultProps,
			linkTo: 'custom',
			customLink: 'http://example.com/custom',
		};
		render( <GalleryImageSave { ...props } /> );
		const link = screen.getByRole( 'link' );
		expect( link ).toHaveAttribute( 'href', 'http://example.com/custom' );
	} );

	it( 'renders image with media link', () => {
		const props = {
			...defaultProps,
			linkTo: 'media',
		};
		render( <GalleryImageSave { ...props } /> );
		const link = screen.getByRole( 'link' );
		expect( link ).toHaveAttribute( 'href', 'http://example.com/image.jpg' );
	} );

	it( 'renders image without link', () => {
		const props = {
			...defaultProps,
			linkTo: 'none',
		};
		render( <GalleryImageSave { ...props } /> );
		expect( screen.getByRole( 'img' ) ).toBeInTheDocument();
		expect( screen.queryByRole( 'link' ) ).not.toBeInTheDocument();
	} );
} );
