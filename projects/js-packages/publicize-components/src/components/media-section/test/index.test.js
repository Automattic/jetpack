import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useSelect } from '@wordpress/data';
import { ReactElement } from 'react';
import MediaSection from '..';
import useAttachedMedia from '../../../hooks/use-attached-media';

// Override data handlers, so we can control data changes.
jest.mock( '@wordpress/data/build/components/use-select', () => jest.fn( () => [] ) );

jest.mock( '../../../hooks/use-attached-media', () => {
	return jest.fn( () => ( {
		attachedMedia: [],
		updateAttachedMedia: jest.fn(),
	} ) );
} );

jest.mock( '../../../hooks/use-social-media-connections', () => {
	return jest.fn( () => ( {
		enabledConnections: [],
	} ) );
} );

jest.mock( '../../../hooks/use-media-restrictions', () => ( {
	__esModule: true,
	default: () => ( {
		maxImageSize: 3,
		getValidationError: jest.fn(),
		allowedMediaTypes: [],
	} ),
	isVideo: () => false,
} ) );

jest.mock( '@wordpress/block-editor', () => {
	const lib = jest.requireActual( '@wordpress/block-editor' );
	return {
		...lib,
		MediaUpload: ( { render: onRender } ) => <div>{ onRender( 'open' ) }</div>,
		MediaUploadCheck: ( { children } ) => children,
	};
} );

jest.mock( '@wordpress/components', () => {
	const actualModule = jest.requireActual( '@wordpress/components' );

	return new Proxy( actualModule, {
		get: ( target, property ) => {
			switch ( property ) {
				case 'ResponsiveWrapper': {
					return ( { children } ) => <div>{ children }</div>;
				}
				default: {
					return target[ property ];
				}
			}
		},
	} );
} );

/**
 * Helper method to set up the user event.
 *
 * @param {ReactElement} jsx - The element to render.
 * @returns {object} An object with the user method and everything from the render method.
 */
const setup = jsx => ( {
	user: userEvent.setup(),
	...render( jsx ),
} );

const dummyImageData = {
	mime_type: 'image/png',
	media_details: {
		filesize: 1000,
		sizes: {
			large: {
				source_url: 'https://example.com/image.png',
				width: 300,
				height: 700,
			},
		},
	},
};

describe( 'MediaSection', () => {
	it( 'should define the component', () => {
		expect( 'MediaSection' ).toBeDefined();
	} );

	it( 'should render the picker if media is not selected', () => {
		useSelect.mockImplementation( () => null );
		render( <MediaSection /> );
		expect( screen.getByText( 'Media' ) ).toBeInTheDocument();
		expect( screen.getByText( /Choose Media/i ) ).toBeInTheDocument();
		expect( screen.getByText( /Add an image or video/i ) ).toBeInTheDocument();
		expect( screen.queryByRole( 'img' ) ).not.toBeInTheDocument();
	} );

	it( 'should render a preview if media is selected', () => {
		useSelect.mockImplementation( () => dummyImageData );
		render( <MediaSection /> );
		expect( screen.getByText( 'Media' ) ).toBeInTheDocument();
		expect( screen.getByText( /Remove media/i ) ).toBeInTheDocument();
		expect( screen.getByRole( 'img' ) ).toBeInTheDocument();
		expect( screen.queryByText( /Choose Media/i ) ).not.toBeInTheDocument();
		expect( screen.queryByText( /Add an image or video/i ) ).not.toBeInTheDocument();
	} );

	it( 'should remove media if remove button is clicked', async () => {
		const updateAttachedMedia = jest.fn();
		useSelect.mockImplementation( () => dummyImageData );
		useAttachedMedia.mockImplementation( () => ( {
			attachedMedia: [],
			updateAttachedMedia,
		} ) );

		const { user } = setup( <MediaSection /> );
		const removeButton = screen.getByText( /Remove media/i );
		await user.click( removeButton );
		expect( updateAttachedMedia ).toHaveBeenCalledWith( [] );
	} );
} );
