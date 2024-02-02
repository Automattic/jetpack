import { useDispatch, useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { store as socialStore } from '../../social-store';
import { usePostJustPublished } from '../use-saving-post';

/**
 * Syncs the post data to the social store.
 */
export function useSyncPostDataToStore() {
	const { mergeConnections } = useDispatch( socialStore );

	const { didPostSaveRequestSucceed, isCurrentPostPublished, getEditedPostAttribute } = useSelect(
		select => select( editorStore ),
		[]
	);

	usePostJustPublished( () => {
		/**
		 * We need to update the connections only when the post is published
		 * and the save request is successful
		 * This is because the connections are updated only when the post is published
		 */
		if ( didPostSaveRequestSucceed() && isCurrentPostPublished() ) {
			// get the fresh connections from the store
			const freshConnections = getEditedPostAttribute( 'jetpack_publicize_connections' );
			// if the connections have changed, merge them into the social store
			if ( freshConnections?.length ) {
				mergeConnections( freshConnections );
			}
		}
	}, [ didPostSaveRequestSucceed, isCurrentPostPublished, getEditedPostAttribute ] );
}
