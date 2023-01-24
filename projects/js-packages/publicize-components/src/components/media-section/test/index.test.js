import { render, screen } from '@testing-library/react';
import { useSelect } from '@wordpress/data';
import MediaSection from '..';

// Override data handlers, so we can control data changes.
jest.mock( '@wordpress/data/build/components/use-select', () => jest.fn( () => [] ) );
// Mock attached media hook
jest.mock( '../../../hooks/use-attached-media', () => {
	return jest.fn( () => ( {
		attachedMedia: [],
		updateAttachedMedia: jest.fn(),
	} ) );
} );
// Mock social media connections hook
jest.mock( '../../../hooks/use-social-media-connections', () => {
	return jest.fn( () => ( {
		enabledConnections: [],
	} ) );
} );
// Mock use media restrictions hook
jest.mock( '../../../hooks/use-media-restrictions', () => ( {
	__esModule: true,
	default: () => ( {
		maxImageSize: 3,
		getValidationError: jest.fn(),
		allowedMediaTypes: [],
	} ),
	isVideo: () => false,
} ) );
// Mock the used child components from Block editor, otherwise they dont render properly.
// Also we are not testing the child comps functionality
jest.mock( '@wordpress/block-editor', () => {
	// Mock only used components
	const lib = jest.requireActual( '@wordpress/block-editor' );
	return {
		...lib,
		MediaUpload: ( { render: onRender } ) => <div>{ onRender( 'open' ) }</div>, // Just render everything in a div
		MediaUploadCheck: ( { children } ) => children, // Just render the children
	};
} );

describe( 'MediaSection', () => {
	it( 'should define the component', () => {
		expect( MediaSection ).toBeDefined();
	} );

	it( 'should render without media picked', () => {
		// Return null, because we test with no image first
		useSelect.mockImplementation( () => null );
		//Render component
		render( <MediaSection /> );

		const mediaTitleElement = screen.getByText( 'Media' );
		const chooseMediaElement = screen.getByText( /Choose Media/i );
		const addImageOrVideoElement = screen.getByText( /Add an image or video/i );
		const bestPracticesLabel = screen.getByText( /Learn photo and video best practices/i );

		expect( mediaTitleElement ).toBeInTheDocument();
		expect( chooseMediaElement ).toBeInTheDocument();
		expect( addImageOrVideoElement ).toBeInTheDocument();
		expect( bestPracticesLabel ).toBeInTheDocument();
	} );
} );
