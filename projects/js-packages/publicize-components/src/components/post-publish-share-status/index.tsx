import { useSelect } from '@wordpress/data';
import { PluginPostPublishPanel } from '@wordpress/edit-post';
import { store as socialStore } from '../../social-store';
import { ShareStatusModal } from '../share-status-modal';

/**
 * Post publish share status component.
 *
 * @return {import('react').ReactNode} - Post publish share status component.
 */
export function PostPublishShareStatus() {
	const { featureFlags } = useSelect( select => {
		const store = select( socialStore );
		return {
			featureFlags: store.featureFlags(),
		};
	}, [] );

	if ( ! featureFlags.useShareStatus ) {
		return null;
	}

	return (
		<PluginPostPublishPanel id="publicize-share-status">
			Your post was successfully shared in 4 connections.
			<ShareStatusModal />
		</PluginPostPublishPanel>
	);
}
