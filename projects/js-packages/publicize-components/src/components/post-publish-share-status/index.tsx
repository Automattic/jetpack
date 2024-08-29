import { useSelect } from '@wordpress/data';
import { PluginPostPublishPanel } from '@wordpress/edit-post';
import { store as editorStore } from '@wordpress/editor';
import { usePostMeta } from '../../hooks/use-post-meta';
import { usePostPrePublishValue } from '../../hooks/use-post-pre-publish-value';
import { store as socialStore } from '../../social-store';
import { ShareStatus } from './share-status';

/**
 * Post publish share status component.
 *
 * @return {import('react').ReactNode} - Post publish share status component.
 */
export function PostPublishShareStatus() {
	const { isPublicizeEnabled } = usePostMeta();
	const { featureFlags, postId, isPostPublised } = useSelect( select => {
		const store = select( socialStore );

		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- `@wordpress/editor` is a nightmare to work with TypeScript
		const _editorStore = select( editorStore ) as any;

		return {
			featureFlags: store.featureFlags(),
			postId: _editorStore.getCurrentPostId(),
			isPostPublised: _editorStore.isCurrentPostPublished(),
		};
	}, [] );

	const enabledConnections = usePostPrePublishValue(
		useSelect( select => select( socialStore ).getEnabledConnections(), [] )
	);

	const willPostBeShared = isPublicizeEnabled && enabledConnections.length > 0;

	if ( ! featureFlags.useShareStatus || ! willPostBeShared || ! isPostPublised ) {
		return null;
	}

	return (
		<PluginPostPublishPanel id="publicize-share-status">
			<ShareStatus postId={ postId } />
		</PluginPostPublishPanel>
	);
}
