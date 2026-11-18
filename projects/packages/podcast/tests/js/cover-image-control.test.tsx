import { loadMediaLibrary } from '@automattic/jetpack-components/tools/load-media-library';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CoverImageControl from '../../src/dashboard/settings/cover-image-control';

jest.mock( '@automattic/jetpack-components/tools/load-media-library', () => ( {
	loadMediaLibrary: jest.fn(),
} ) );
const mockedLoadMediaLibrary = loadMediaLibrary as unknown as jest.Mock;

const mockOpen = jest.fn();
jest.mock( '@wordpress/media-utils', () => ( {
	MediaUpload: ( {
		render: renderTrigger,
	}: {
		render: ( props: { open: () => void } ) => unknown;
	} ) => renderTrigger( { open: mockOpen } ),
} ) );

const renderControl = () =>
	render(
		<CoverImageControl imageUrl="" imageId={ 0 } onSelect={ jest.fn() } onRemove={ jest.fn() } />
	);

beforeEach( () => {
	mockOpen.mockReset();
	mockedLoadMediaLibrary.mockReset();
} );

describe( 'CoverImageControl', () => {
	it( 'opens the media library once it has loaded, busy until then', async () => {
		const user = userEvent.setup();
		let finishLoading: () => void = () => {};
		mockedLoadMediaLibrary.mockReturnValue(
			new Promise< void >( resolve => {
				finishLoading = resolve;
			} )
		);
		renderControl();
		const trigger = screen.getByRole( 'button', { name: 'Set cover image' } );

		await user.click( trigger );

		expect( trigger ).toHaveAttribute( 'aria-disabled', 'true' );
		expect( mockOpen ).not.toHaveBeenCalled();

		await act( async () => finishLoading() );

		expect( mockOpen ).toHaveBeenCalledTimes( 1 );
		expect( trigger ).not.toHaveAttribute( 'aria-disabled' );
	} );

	it( 'says so when the media library fails to load, until a retry loads it', async () => {
		const user = userEvent.setup();
		mockedLoadMediaLibrary.mockRejectedValueOnce( new Error( 'HTTP 500' ) );
		renderControl();
		const trigger = screen.getByRole( 'button', { name: 'Set cover image' } );

		await user.click( trigger );

		expect( mockOpen ).not.toHaveBeenCalled();
		await expect( screen.findByRole( 'alert' ) ).resolves.toHaveTextContent(
			'The media library could not be loaded. Try again.'
		);

		mockedLoadMediaLibrary.mockResolvedValueOnce( undefined );
		await user.click( trigger );

		expect( mockOpen ).toHaveBeenCalledTimes( 1 );
		expect( screen.queryByRole( 'alert' ) ).not.toBeInTheDocument();
	} );
} );
