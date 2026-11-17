import { fireEvent, render, screen } from '@testing-library/react';
import PlaylistVideos from '../playlist-videos';

jest.mock( '../../../hooks/use-video-live-metadata', () => ( {
	useVideoLiveMetadata: () => ( {} ),
} ) );

const dataTransfer = { setData: jest.fn(), effectAllowed: '', dropEffect: '' };

describe( 'PlaylistVideos', () => {
	it( 'moves a dragged video to the row it is dropped on', () => {
		const onChange = jest.fn();
		render(
			<PlaylistVideos
				videos={ [ { guid: 'aaaaaaa1' }, { guid: 'bbbbbbb2' }, { guid: 'ccccccc3' } ] }
				onChange={ onChange }
			/>
		);
		const rows = screen.getAllByRole( 'listitem' );

		fireEvent.dragStart( rows[ 2 ], { dataTransfer } );
		fireEvent.dragOver( rows[ 0 ], { dataTransfer } );
		fireEvent.drop( rows[ 0 ], { dataTransfer } );

		expect( onChange ).toHaveBeenCalledWith( [
			{ guid: 'ccccccc3' },
			{ guid: 'aaaaaaa1' },
			{ guid: 'bbbbbbb2' },
		] );
	} );
} );
