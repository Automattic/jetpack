import { ThemeProvider } from '@automattic/jetpack-components';
import PostPublishManualSharing from '../../post-publish-manual-sharing';
import PostPublishReviewPrompt from '../../post-publish-review-prompt';
import { PostPublishShareStatus } from '../../post-publish-share-status';

const PostPublishPanels = () => {
	return (
		<ThemeProvider targetDom={ document.body }>
			<PostPublishShareStatus />
			<PostPublishManualSharing />
			<PostPublishReviewPrompt />
		</ThemeProvider>
	);
};

export default PostPublishPanels;
