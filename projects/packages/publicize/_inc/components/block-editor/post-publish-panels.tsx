import { ThemeProvider } from '@automattic/jetpack-components';
import { PostPublishCompanionPlugins } from '../companion-plugin-notice/post-publish-companion-plugins';
import PostPublishManualSharing from '../post-publish-manual-sharing';
import { PostPublishShareStatus } from '../post-publish-share-status';

const PostPublishPanels = () => {
	return (
		<ThemeProvider targetDom={ document.body }>
			<PostPublishShareStatus />
			<PostPublishManualSharing />
			<PostPublishCompanionPlugins />
		</ThemeProvider>
	);
};

export default PostPublishPanels;
