import { render, screen, waitFor } from '@testing-library/react';
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
	...jest.requireActual( '../../../hooks/use-media-restrictions' ),
	__esModule: true,
	default: () => ( {
		maxImageSize: 3,
		getValidationError: jest.fn(),
		allowedMediaTypes: [],
	} ),
} ) );

jest.mock( '@wordpress/block-editor', () => ( {
	...jest.requireActual( '@wordpress/block-editor' ),
	MediaUpload: ( { render: onRender } ) => <div>{ onRender( 'open' ) }</div>,
	MediaUploadCheck: ( { children } ) => children,
} ) );

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

// Fix a bug throwing a React warning when muted property is present.
// @see: https://github.com/testing-library/react-testing-library/issues/470
Object.defineProperty( HTMLMediaElement.prototype, 'muted', {
	set: () => {},
} );

// Mock video methods
jest.spyOn( window.HTMLMediaElement.prototype, 'load' ).mockImplementation( () => {} );
jest.spyOn( window.HTMLMediaElement.prototype, 'play' ).mockImplementation( () => {} );
jest.spyOn( window.HTMLMediaElement.prototype, 'pause' ).mockImplementation( () => {} );

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

const dummyVideoData = {
	mime_type: 'video/mp4',
	media_details: {
		filesize: 1000,
		length: 15,
		sizes: {
			large: {
				source_url: 'https://example.com/video.mp4',
				width: 1280,
				height: 720,
			},
		},
	},
};

describe( 'MediaSection', () => {
	it( 'should define the component', () => {
		expect( 'MediaSection' ).toBeDefined();
	} );

	it( 'should render the picker if media is not selected', async () => {
		useSelect.mockImplementation( () => null );
		render( <MediaSection /> );
		await expect( screen.findByText( 'Media' ) ).resolves.toBeInTheDocument();
		await expect( screen.findByText( /Choose Media/i ) ).resolves.toBeInTheDocument();
		await expect( screen.findByText( /Add an image or video/i ) ).resolves.toBeInTheDocument();
		expect( screen.queryByRole( 'img' ) ).not.toBeInTheDocument();
	} );

	it( 'should render a preview if an image is selected', async () => {
		useSelect.mockImplementation( () => dummyImageData );
		render( <MediaSection /> );
		await expect( screen.findByText( 'Media' ) ).resolves.toBeInTheDocument();
		await expect( screen.findByText( /Remove media/i ) ).resolves.toBeInTheDocument();
		await expect( screen.findByRole( 'img' ) ).resolves.toBeInTheDocument();
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
		const removeButton = await screen.findByText( /Remove media/i );
		await user.click( removeButton );
		expect( updateAttachedMedia ).toHaveBeenCalledWith( [] );
	} );

	it( 'should render a video preview if a video is selected', async () => {
		useSelect.mockImplementation( () => dummyVideoData );
		render( <MediaSection /> );
		await expect( screen.findByText( 'Media' ) ).resolves.toBeInTheDocument();
		await expect( screen.findByText( /Remove media/i ) ).resolves.toBeInTheDocument();
		await expect(
			screen.findByText( ( _, element ) => element.tagName.toLowerCase() === 'video' )
		).resolves.toBeInTheDocument();
		expect( screen.queryByText( /Choose Media/i ) ).not.toBeInTheDocument();
		expect( screen.queryByText( /Add an image or video/i ) ).not.toBeInTheDocument();
		await waitFor( () => {
			expect( window.HTMLMediaElement.prototype.load ).toHaveBeenCalled();
		} );
	} );

	it( 'should play and pause the video when it is hovered and unhovered', async () => {
		useSelect.mockImplementation( () => dummyVideoData );
		const { user } = setup( <MediaSection /> );
		const video = await screen.findByText(
			( _, element ) => element.tagName.toLowerCase() === 'video'
		);

		await user.hover( video );
		await waitFor( () =>
			expect( window.HTMLMediaElement.prototype.play ).toHaveBeenCalledTimes( 1 )
		);
		await user.unhover( video );
		await waitFor( () =>
			expect( window.HTMLMediaElement.prototype.pause ).toHaveBeenCalledTimes( 1 )
		);
	} );
} );
