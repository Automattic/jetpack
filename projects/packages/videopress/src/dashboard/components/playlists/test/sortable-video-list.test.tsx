import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SortableVideoList from '../sortable-video-list';
import type { PlaylistVideo } from '../../../hooks/use-playlist-videos';

const video = ( id: number, title: string, durationSeconds = 0 ): PlaylistVideo => ( {
	id,
	title,
	thumbnailUrl: null,
	durationSeconds,
	uploadDate: '',
	playlistIds: [ 7 ],
} );

const VIDEOS = [ video( 1, 'Alpha', 65 ), video( 2, 'Beta' ), video( 3, 'Gamma', 3700 ) ];

describe( 'SortableVideoList', () => {
	it( 'renders a row per video with position, title, duration, and drag handle', () => {
		render(
			<SortableVideoList videos={ VIDEOS } onReorder={ jest.fn() } onRemove={ jest.fn() } />
		);

		const rows = screen.getAllByRole( 'listitem' );
		expect( rows ).toHaveLength( 3 );
		expect( rows[ 0 ] ).toHaveTextContent( 'Alpha' );
		// Position numbers are 1-based.
		expect( rows[ 0 ] ).toHaveTextContent( '1' );
		expect( rows[ 2 ] ).toHaveTextContent( '3' );
		// mm:ss under an hour, h:mm:ss above.
		expect( rows[ 0 ] ).toHaveTextContent( '01:05' );
		expect( rows[ 2 ] ).toHaveTextContent( '1:01:40' );

		// dnd-kit's activator: one keyboard-reachable drag handle per row.
		expect( screen.getByRole( 'button', { name: 'Drag to reorder Alpha' } ) ).toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: 'Drag to reorder Gamma' } ) ).toBeInTheDocument();
	} );

	it( 'emits the full reordered id list from the move buttons', async () => {
		const onReorder = jest.fn();
		render(
			<SortableVideoList videos={ VIDEOS } onReorder={ onReorder } onRemove={ jest.fn() } />
		);

		await userEvent.click( screen.getByRole( 'button', { name: 'Move Beta up' } ) );
		expect( onReorder ).toHaveBeenLastCalledWith( [ 2, 1, 3 ] );

		await userEvent.click( screen.getByRole( 'button', { name: 'Move Beta down' } ) );
		expect( onReorder ).toHaveBeenLastCalledWith( [ 1, 3, 2 ] );

		expect( onReorder ).toHaveBeenCalledTimes( 2 );
	} );

	it( 'does not emit for boundary moves (first up / last down are disabled)', async () => {
		const onReorder = jest.fn();
		render(
			<SortableVideoList videos={ VIDEOS } onReorder={ onReorder } onRemove={ jest.fn() } />
		);

		await userEvent.click( screen.getByRole( 'button', { name: 'Move Alpha up' } ) );
		await userEvent.click( screen.getByRole( 'button', { name: 'Move Gamma down' } ) );

		expect( onReorder ).not.toHaveBeenCalled();
	} );

	it( 'emits the row video from the remove action', async () => {
		const onRemove = jest.fn();
		render( <SortableVideoList videos={ VIDEOS } onReorder={ jest.fn() } onRemove={ onRemove } /> );

		await userEvent.click( screen.getByRole( 'button', { name: 'Remove Beta from playlist' } ) );

		expect( onRemove ).toHaveBeenCalledTimes( 1 );
		expect( onRemove ).toHaveBeenCalledWith( VIDEOS[ 1 ] );
	} );
} );
