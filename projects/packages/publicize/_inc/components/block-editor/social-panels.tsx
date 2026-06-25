import { ThemeProvider } from '@automattic/jetpack-components';
import { PostTypeSupportCheck } from '@wordpress/editor';
import { useConnectionCreatedListener } from '../../hooks/use-connection-created-listener';
import { getSocialScriptData } from '../../utils/script-data';
import { GlobalModals } from '../global-modals';
import PostPublishPanels from './post-publish-panels';
import PrePublishPanels from './pre-publish-panels';

/**
 * Social panels needed in the block editor
 *
 * @return The social panels
 */
export function SocialPanels() {
	// Refresh + close the modal when an admin tab opened from here reports a new connection.
	useConnectionCreatedListener();

	if ( ! getSocialScriptData().is_publicize_enabled ) {
		return null;
	}
	return (
		<PostTypeSupportCheck supportKeys="publicize">
			<ThemeProvider targetDom={ document.body }>
				<PrePublishPanels />
				<PostPublishPanels />
				<GlobalModals />
			</ThemeProvider>
		</PostTypeSupportCheck>
	);
}
