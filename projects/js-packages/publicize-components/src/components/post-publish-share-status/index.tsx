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

		const _editorStore = select( editorStore );

		return {
			featureFlags: store.featureFlags(),
			// @ts-expect-error -- `@wordpress/editor` is a nightmare to work with TypeScript
			postId: _editorStore.getCurrentPostId(),
			// @ts-expect-error -- `@wordpress/editor` is a nightmare to work with TypeScript
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
