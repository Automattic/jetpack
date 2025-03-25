import { useDispatch, useSelect } from '@wordpress/data';
import { PluginPostPublishPanel, store as editorStore } from '@wordpress/editor';
import { useIsSharingPossible } from '../../hooks/use-is-sharing-possible';
import { usePostMeta } from '../../hooks/use-post-meta';
import { usePostPrePublishValue } from '../../hooks/use-post-pre-publish-value';
import { usePostJustPublished } from '../../hooks/use-saving-post';
import { store as socialStore } from '../../social-store';
import { getSocialScriptData } from '../../utils/script-data';
import { ShareStatus } from './share-status';

/**
 * Post publish share status component.
 *
 * @return {import('react').ReactNode} - Post publish share status component.
 */
export function PostPublishShareStatus() {
	const { isPublicizeEnabled } = usePostMeta();
	const { pollForPostShareStatus } = useDispatch( socialStore );
	const { feature_flags } = getSocialScriptData();

	const { isPostPublished } = useSelect( select => {
		const _editorStore = select( editorStore );

		return {
			isPostPublished: _editorStore.isCurrentPostPublished(),
		};
	}, [] );

	const isSharingPossible = usePostPrePublishValue( useIsSharingPossible() );

	const enabledConnections = usePostPrePublishValue(
		useSelect( select => select( socialStore ).getEnabledConnections(), [] )
	);

	const willPostBeShared = isPublicizeEnabled && enabledConnections.length > 0 && isSharingPossible;

	const showStatus = feature_flags.useShareStatus && willPostBeShared && isPostPublished;

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
		<PluginPostPublishPanel>
			<ShareStatus />
		</PluginPostPublishPanel>
	);
}
