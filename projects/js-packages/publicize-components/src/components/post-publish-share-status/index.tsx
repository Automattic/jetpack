import { useDispatch, useSelect } from '@wordpress/data';
import { PluginPostPublishPanel } from '@wordpress/edit-post';
import { store as editorStore } from '@wordpress/editor';
import { useIsSharingPossible } from '../../hooks/use-is-sharing-possible';
import { usePostMeta } from '../../hooks/use-post-meta';
import { usePostPrePublishValue } from '../../hooks/use-post-pre-publish-value';
import { usePostJustPublished } from '../../hooks/use-saving-post';
import { store as socialStore } from '../../social-store';
import { ShareStatus } from './share-status';

/**
 * Post publish share status component.
 *
 * @return {import('react').ReactNode} - Post publish share status component.
 */
export function PostPublishShareStatus() {
	const { isPublicizeEnabled } = usePostMeta();
	const { pollForPostShareStatus } = useDispatch( socialStore );
	const { featureFlags, isPostPublised } = useSelect( select => {
		const store = select( socialStore );

		const _editorStore = select( editorStore );

		return {
			featureFlags: store.featureFlags(),
			// @ts-expect-error -- `@wordpress/editor` is a nightmare to work with TypeScript
			isPostPublised: _editorStore.isCurrentPostPublished(),
		};
	}, [] );

	const isSharingPossible = usePostPrePublishValue( useIsSharingPossible() );

	const enabledConnections = usePostPrePublishValue(
		useSelect( select => select( socialStore ).getEnabledConnections(), [] )
	);

	const willPostBeShared = isPublicizeEnabled && enabledConnections.length > 0 && isSharingPossible;

	const showStatus = featureFlags.useShareStatus && willPostBeShared && isPostPublised;

	usePostJustPublished( () => {
		if ( showStatus ) {
			pollForPostShareStatus( {
				isRequestComplete( { postShareStatus } ) {
					return postShareStatus.done;
				},
			} );
		}
	}, [ showStatus ] );

	if ( ! showStatus ) {
		return null;
	}

	return (
		<PluginPostPublishPanel id="publicize-share-status">
			<ShareStatus />
		</PluginPostPublishPanel>
	);
}
