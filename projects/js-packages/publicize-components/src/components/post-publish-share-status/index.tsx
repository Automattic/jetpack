import { useSelect } from '@wordpress/data';
import { PluginPostPublishPanel } from '@wordpress/edit-post';
import { store as editorStore } from '@wordpress/editor';
import { usePostMeta } from '../../hooks/use-post-meta';
import { ShareStatus } from './share-status';

/**
 * Post publish share status component.
 *
 * @return {import('react').ReactNode} - Post publish share status component.
 */
export function PostPublishShareStatus() {
	const { isPublicizeEnabled: willPostBeShared } = usePostMeta();
	const { postId, isPostPublised } = useSelect( select => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- `@wordpress/editor` is a nightmare to work with TypeScript
		const _editorStore = select( editorStore ) as any;

		return {
			postId: _editorStore.getCurrentPostId(),
			isPostPublised: _editorStore.isCurrentPostPublished(),
		};
	}, [] );

	if ( ! willPostBeShared || ! isPostPublised ) {
		return null;
	}

	return (
		<PluginPostPublishPanel id="publicize-share-status">
			<ShareStatus postId={ postId } />
		</PluginPostPublishPanel>
	);
}
