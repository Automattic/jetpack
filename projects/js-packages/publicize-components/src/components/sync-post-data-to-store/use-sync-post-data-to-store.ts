import { select as coreSelect, useDispatch } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { usePostJustPublished } from '../../hooks/use-saving-post';
import { store as socialStore } from '../../social-store';

/**
 * Syncs the post data to the social store.
 */
export function useSyncPostDataToStore() {
	const { mergeConnections } = useDispatch( socialStore );

	usePostJustPublished( () => {
		/**
		 * We need to update the connections only when the post is published
		 * and the save request is successful
		 * This is because the connections are updated only when the post is published
		 */
		if (
			coreSelect( editorStore ).didPostSaveRequestSucceed() &&
			coreSelect( editorStore ).isCurrentPostPublished()
		) {
			// get the fresh connections from the store
			const freshConnections = coreSelect( editorStore ).getEditedPostAttribute(
				'jetpack_publicize_connections'
			);
			// if the connections have changed, merge them into the social store
			if ( freshConnections?.length ) {
				mergeConnections( freshConnections );
			}
		}
	} );
}
