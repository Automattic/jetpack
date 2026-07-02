import { render, screen } from '@testing-library/react';
import StudioEditorConfirmDialog from '../../editor/confirm-dialog';
import SelectArtworkFromPlaylistModal from '../../playlists/select-artwork-from-playlist-modal';
import ChaptersHelpModal from '../../video-details/chapters-help-modal';
import SelectFrameDialog from '../../video-details/select-frame-dialog';
import { STUDIO_DIALOG_CLASS } from '../index';
import type { ReactElement } from 'react';

// Every Studio-owned `@wordpress/ui` dialog opts into content-area centering
// by passing STUDIO_DIALOG_CLASS as `Dialog.Popup`'s className (the
// positioning rules in ../style.scss key off it — see that file for the
// wp-admin chrome ladder). These are the prop-driven dialogs that render
// without providers; the query-backed ones (create playlist, thumbnail
// card's add-to-playlist) assert the same class in their own test files, and
// the DataViews-hosted modals are positioned via the stable
// `.dataviews-action-modal` overlay class with no opt-in to assert.
describe( 'STUDIO_DIALOG_CLASS wiring', () => {
	const dialogs: [ string, () => ReactElement ][] = [
		[
			'StudioEditorConfirmDialog',
			() => (
				<StudioEditorConfirmDialog
					isOpen
					title="Discard changes?"
					message="This cannot be undone."
					confirmLabel="Discard"
					onConfirm={ jest.fn() }
					onCancel={ jest.fn() }
				/>
			),
		],
		[ 'ChaptersHelpModal', () => <ChaptersHelpModal isOpen onClose={ jest.fn() } /> ],
		[
			'SelectArtworkFromPlaylistModal',
			() => (
				<SelectArtworkFromPlaylistModal
					isOpen
					videos={ [] }
					onClose={ jest.fn() }
					onSelect={ jest.fn() }
				/>
			),
		],
		[
			'SelectFrameDialog',
			() => (
				<SelectFrameDialog
					src="https://example.com/video.mp4"
					isOpen
					onClose={ jest.fn() }
					onConfirm={ jest.fn() }
				/>
			),
		],
	];

	it.each( dialogs )( '%s popup carries the content-area centering class', ( _name, ui ) => {
		render( ui() );

		expect( screen.getByRole( 'dialog' ) ).toHaveClass( STUDIO_DIALOG_CLASS );
	} );
} );
