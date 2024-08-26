import { useSelect } from '@wordpress/data';
import { PluginPostPublishPanel } from '@wordpress/edit-post';
import { store as editorStore } from '@wordpress/editor';
import { store as socialStore } from '../../social-store';
import { ShareStatus } from './share-status';

/**
 * Post publish share status component.
 *
 * @return {import('react').ReactNode} - Post publish share status component.
 */
export function PostPublishShareStatus() {
	const { featureFlags, postId, isPostPublised, willPostBeShared } = useSelect( select => {
		const store = select( socialStore );

		const meta = select( editorStore ).getEditedPostAttribute( 'meta' );

		return {
			featureFlags: store.featureFlags(),
			postId: select( editorStore ).getCurrentPostId(),
			isPostPublised: select( editorStore ).isCurrentPostPublished(),
			willPostBeShared: meta.jetpack_publicize_feature_enabled,
		};
	}, [] );

	if ( ! featureFlags.useShareStatus || ! willPostBeShared || ! isPostPublised ) {
		return null;
	}

	return (
		<PluginPostPublishPanel id="publicize-share-status">
			<ShareStatus postId={ postId } />
		</PluginPostPublishPanel>
	);
}
