import { __, _n } from '@wordpress/i18n';
import DeletePlaylistModal from './delete-playlist-modal';
import type { Playlist } from '../../types/playlist';
import type { Action } from '@wordpress/dataviews';

type Api = {
	openPlaylist: ( id: number ) => void;
};

/**
 * Build the DataViews actions array for the Playlists tab. Edit is the
 * primary action and navigates to the playlist's detail route. Delete
 * confirms through a DataViews modal (see DeletePlaylistModal, which owns
 * the mutation) and supports bulk selection.
 *
 * @param api - Navigation callbacks forwarded into the action callbacks.
 * @return The actions array for `<DataViews>`.
 */
export function buildPlaylistActions( api: Api ): Action< Playlist >[] {
	return [
		{
			id: 'edit',
			label: __( 'Edit', 'jetpack-videopress-pkg' ),
			isPrimary: true,
			supportsBulk: false,
			callback: items => {
				const [ item ] = items;
				if ( item ) {
					api.openPlaylist( item.id );
				}
			},
		},
		{
			id: 'delete',
			label: __( 'Delete', 'jetpack-videopress-pkg' ),
			supportsBulk: true,
			RenderModal: DeletePlaylistModal,
			modalHeader: items =>
				_n( 'Delete playlist', 'Delete playlists', items.length, 'jetpack-videopress-pkg' ),
		},
	];
}
