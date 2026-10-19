import { render, screen } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
import ServerPreview from '../server-preview';

jest.mock( '@wordpress/api-fetch', () => ( {
	__esModule: true,
	default: jest.fn(),
} ) );

const apiFetchMock = apiFetch as unknown as jest.Mock;

/**
 * Render a preview of the Latest Videos Playlist block.
 *
 * @return The render result.
 */
function renderPreview() {
	return render(
		<ServerPreview
			block="videopress/latest-videos-playlist"
			attributes={ { count: 3, orderBy: 'popular' } }
			label="Latest Videos Playlist"
			emptyInstructions="Upload a VideoPress video to see it here."
		/>
	);
}

beforeEach( () => {
	apiFetchMock.mockReset();
} );

describe( 'ServerPreview', () => {
	it( 'shows the block as the server renders it with its attributes', async () => {
		apiFetchMock.mockResolvedValue( { rendered: '<p>Most viewed</p>' } );
		renderPreview();

		await expect( screen.findByText( 'Most viewed' ) ).resolves.toBeInTheDocument();
		const { path } = apiFetchMock.mock.calls[ 0 ][ 0 ];
		expect( path.split( '?' )[ 0 ] ).toBe(
			'/wp/v2/block-renderer/videopress/latest-videos-playlist'
		);
		expect( Object.fromEntries( new URLSearchParams( path.split( '?' )[ 1 ] ) ) ).toMatchObject( {
			context: 'edit',
			'attributes[count]': '3',
			'attributes[orderBy]': 'popular',
		} );
	} );

	it.each( [
		[ 'renders nothing', () => apiFetchMock.mockResolvedValue( { rendered: '  ' } ) ],
		[ 'fails', () => apiFetchMock.mockRejectedValue( new Error( 'rest_forbidden' ) ) ],
	] )( 'explains what the block shows when the server %s', async ( _, respond ) => {
		respond();
		renderPreview();

		await expect(
			screen.findByText( 'Upload a VideoPress video to see it here.', {
				ignore: '.a11y-speak-region',
			} )
		).resolves.toBeInTheDocument();
		expect( screen.getByText( 'Latest Videos Playlist' ) ).toBeInTheDocument();
	} );
} );
