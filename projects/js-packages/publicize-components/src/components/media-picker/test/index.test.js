import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReactElement } from 'react';
import MediaPicker from '..';

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
const setup = async jsx => ( {
	user: await userEvent.setup(),
	...render( jsx ),
} );

const DUMMY_IMAGE_DETAILS = {
	mediaData: {
		width: 300,
		height: 700,
		sourceUrl: 'https://example.com/image.png',
	},
	metaData: {
		mime: 'image/png',
		fileSize: 1000,
	},
};

const DUMMY_VIDEO_DETAILS = {
	mediaData: {
		width: 1280,
		height: 720,
		sourceUrl: 'https://example.com/video.mp4',
	},
	metaData: {
		mime: 'video/mp4',
		length: 15,
		fileSize: 1000,
	},
};

const MediaPickerMock = ( { detailsMock = {}, mediaIdMock = null, onChangeMock = {} } ) => (
	<MediaPicker
		buttonLabel={ 'Choose media' }
		subTitle={ 'Add an image or video' }
		mediaId={ mediaIdMock }
		mediaDetails={ detailsMock }
		onChange={ onChangeMock }
		allowedMediaTypes={ [] }
	/>
);

describe( 'MediaPicker', () => {
	it( 'should render the picker if media is not selected', async () => {
		render( <MediaPickerMock /> );

		await expect( screen.findByText( /Choose Media/i ) ).resolves.toBeInTheDocument();
		await expect( screen.findByText( /Add an image or video/i ) ).resolves.toBeInTheDocument();
		expect( screen.queryByTestId( 'spinner' ) ).not.toBeInTheDocument();
		expect( screen.queryByRole( 'img' ) ).not.toBeInTheDocument();
	} );

	it( 'should render a preview if an image is selected', async () => {
		render( <MediaPickerMock detailsMock={ DUMMY_IMAGE_DETAILS } mediaIdMock={ 1 } /> );

		await expect( screen.findByText( /Remove media/i ) ).resolves.toBeInTheDocument();
		await expect( screen.findByRole( 'img' ) ).resolves.toBeInTheDocument();
		expect( screen.queryByText( /Choose Media/i ) ).not.toBeInTheDocument();
		expect( screen.queryByText( /Add an image or video/i ) ).not.toBeInTheDocument();
		expect( screen.queryByTestId( 'spinner' ) ).not.toBeInTheDocument();
	} );

	it( 'should render a spinner while mediaDetails is absent', async () => {
		render( <MediaPickerMock detailsMock={ {} } mediaIdMock={ 1 } /> );

		await expect( screen.findByText( /Remove media/i ) ).resolves.toBeInTheDocument();
		await expect( screen.findByTestId( 'spinner' ) ).resolves.toBeInTheDocument();
	} );

	it( 'should remove media if remove button is clicked', async () => {
		const onChangeMock = jest.fn();
		const { user } = await setup(
			<MediaPickerMock
				detailsMock={ DUMMY_IMAGE_DETAILS }
				mediaIdMock={ 1 }
				onChangeMock={ onChangeMock }
			/>
		);
		const removeButton = await screen.findByText( /Remove media/i );
		await user.click( removeButton );
		expect( onChangeMock ).toHaveBeenCalledWith( null );
	} );

	it( 'should render a video preview if a video is selected', async () => {
		render( <MediaPickerMock detailsMock={ DUMMY_VIDEO_DETAILS } mediaIdMock={ 1 } /> );

		await expect( screen.findByText( /Remove media/i ) ).resolves.toBeInTheDocument();
		await expect(
			screen.findByText( ( _, element ) => element.tagName.toLowerCase() === 'video' )
		).resolves.toBeInTheDocument();
		expect( screen.queryByText( /Choose Media/i ) ).not.toBeInTheDocument();
		expect( screen.queryByText( /Add an image or video/i ) ).not.toBeInTheDocument();
		expect( window.HTMLMediaElement.prototype.load ).toHaveBeenCalled();
	} );

	it( 'should play and pause the video when it is hovered and unhovered', async () => {
		const { user } = await setup(
			<MediaPickerMock detailsMock={ DUMMY_VIDEO_DETAILS } mediaIdMock={ 1 } />
		);
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
