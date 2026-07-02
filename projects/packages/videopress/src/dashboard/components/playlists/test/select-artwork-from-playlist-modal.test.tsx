import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SelectArtworkFromPlaylistModal from '../select-artwork-from-playlist-modal';
import type { PlaylistVideo } from '../../../hooks/use-playlist-videos';

const video = ( id: number, extra: Partial< PlaylistVideo > = {} ): PlaylistVideo => ( {
	id,
	title: `Video ${ id }`,
	thumbnailUrl: `https://example.com/poster-${ id }.jpg`,
	durationSeconds: 60,
	uploadDate: '2026-01-01T00:00:00',
	playlistIds: [ 1 ],
	...extra,
} );

describe( 'SelectArtworkFromPlaylistModal', () => {
	it( 'renders nothing while closed', () => {
		render(
			<SelectArtworkFromPlaylistModal
				isOpen={ false }
				videos={ [ video( 1 ) ] }
				onClose={ jest.fn() }
				onSelect={ jest.fn() }
			/>
		);
		expect( screen.queryByText( 'Select artwork' ) ).not.toBeInTheDocument();
	} );

	it( 'renders one clickable option per video with its title', () => {
		render(
			<SelectArtworkFromPlaylistModal
				isOpen
				videos={ [ video( 1 ), video( 2, { thumbnailUrl: null } ) ] }
				onClose={ jest.fn() }
				onSelect={ jest.fn() }
			/>
		);

		// Dialog.Popup is an unpadded flex column; body padding (and scroll)
		// comes from Dialog.Content, marked by the overlay scroll-container
		// attribute. Guards against the grid sitting flush against the popup
		// edges.
		expect(
			// eslint-disable-next-line testing-library/no-node-access -- asserting an ancestor region requires DOM traversal.
			screen.getByText( 'Video 1' ).closest( '[data-wp-ui-overlay-scroll-container]' )
		).not.toBeNull();
		expect( screen.getByText( 'Video 1' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Video 2' ) ).toBeInTheDocument();
		expect(
			screen.getByRole( 'button', { name: 'Use the poster of Video 1 as artwork' } )
		).toBeInTheDocument();
		// A missing poster (placeholder thumbnail) still renders a selectable option.
		expect(
			screen.getByRole( 'button', { name: 'Use the poster of Video 2 as artwork' } )
		).toBeInTheDocument();
	} );

	it( 'fires onSelect with the clicked video', async () => {
		const user = userEvent.setup();
		const onSelect = jest.fn();
		const second = video( 2 );
		render(
			<SelectArtworkFromPlaylistModal
				isOpen
				videos={ [ video( 1 ), second ] }
				onClose={ jest.fn() }
				onSelect={ onSelect }
			/>
		);

		await user.click(
			screen.getByRole( 'button', { name: 'Use the poster of Video 2 as artwork' } )
		);
		expect( onSelect ).toHaveBeenCalledTimes( 1 );
		expect( onSelect ).toHaveBeenCalledWith( second );
	} );

	it( 'shows a fallback message for an empty playlist', () => {
		render(
			<SelectArtworkFromPlaylistModal
				isOpen
				videos={ [] }
				onClose={ jest.fn() }
				onSelect={ jest.fn() }
			/>
		);
		expect( screen.getByText( 'No videos in this playlist yet.' ) ).toBeInTheDocument();
	} );
} );
