import { ThemeProvider } from '@automattic/jetpack-components';
import PostPublishManualSharing from '../post-publish-manual-sharing';
import { PostPublishShareStatus } from '../post-publish-share-status';

const PostPublishPanels = () => {
	return (
		<ThemeProvider targetDom={ document.body }>
			<PostPublishShareStatus />
			<PostPublishManualSharing />
		</ThemeProvider>
	);
};

export default PostPublishPanels;
