import { siteHasFeature } from '@automattic/jetpack-script-data';
import { useDispatch, useSelect } from '@wordpress/data';
import { PluginPostPublishPanel as DeprecatedPluginPostPublishPanel } from '@wordpress/edit-post';
import {
	store as editorStore,
	PluginPostPublishPanel as EditorPluginPostPublishPanel,
} from '@wordpress/editor';
import { useIsSharingPossible } from '../../hooks/use-is-sharing-possible';
import { usePostMeta } from '../../hooks/use-post-meta';
import { usePostPrePublishValue } from '../../hooks/use-post-pre-publish-value';
import { usePostJustPublished } from '../../hooks/use-saving-post';
import { store as socialStore } from '../../social-store';
import { features } from '../../utils/constants';
import { ShareStatus } from './share-status';

const PluginPostPublishPanel = EditorPluginPostPublishPanel || DeprecatedPluginPostPublishPanel;

/**
 * Post publish share status component.
 *
 * @return {import('react').ReactNode} - Post publish share status component.
 */
export function PostPublishShareStatus() {
	const { isPublicizeEnabled } = usePostMeta();
	const { pollForPostShareStatus } = useDispatch( socialStore );

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

	const showStatus = siteHasFeature( features.SHARE_STATUS ) && willPostBeShared && isPostPublished;

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
