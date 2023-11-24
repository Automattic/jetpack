import { select as coreSelect, subscribe, useDispatch, useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { useRef } from '@wordpress/element';
import { store as socialStore } from '../social-store';

/**
 * Syncs the post data to the social store.
 */
export function useSyncPostDataToStore() {
	const postConnectionsUnsubscribe = useRef( null );
	const { mergeConnections } = useDispatch( socialStore );

	const isPublishingPost = useSelect( select => select( editorStore ).isPublishingPost(), [] );

	/**
	 * To sync connections:
	 * We will subscribe only when the post is being published and we are not already subscribed.
	 * This is because we want to sync connections only when a post is published
	 */
	if ( isPublishingPost && ! postConnectionsUnsubscribe.current ) {
		// get the previous connections before we subscribe
		const prevConnections = coreSelect( editorStore ).getEditedPostAttribute(
			'jetpack_publicize_connections'
		);
		// subscribe to editor store
		postConnectionsUnsubscribe.current = subscribe( () => {
			/**
			 * We need to update the connections only when the post is published
			 * and the save request is successful
			 * This is because the connections are updated only when the post is published
			 */
			if (
				coreSelect( editorStore ).didPostSaveRequestSucceed() &&
				coreSelect( editorStore ).isCurrentPostPublished()
			) {
				// unsubscribe and clear the ref
				postConnectionsUnsubscribe.current?.();
				postConnectionsUnsubscribe.current = null;

				// get the fresh connections from the store
				const freshConnections = coreSelect( editorStore ).getEditedPostAttribute(
					'jetpack_publicize_connections'
				);
				// if the connections have changed, merge them into the social store
				if ( freshConnections !== prevConnections ) {
					mergeConnections( freshConnections );
				}
			}
		}, editorStore );
	}
}
