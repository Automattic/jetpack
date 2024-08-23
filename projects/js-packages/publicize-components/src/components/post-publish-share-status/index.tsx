import { PluginPostPublishPanel } from '@wordpress/edit-post';
import { ShareStatusModal } from '../share-status-modal';

/**
 * Post publish share status component.
 *
 * @return {import('react').ReactNode} - Post publish share status component.
 */
export function PostPublishShareStatus() {
	return (
		<PluginPostPublishPanel id="publicize-share-status">
			Your post was successfully shared in 4 connections.
			<ShareStatusModal />
		</PluginPostPublishPanel>
	);
}
