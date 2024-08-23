import { ThemeProvider } from '@automattic/jetpack-components';
import PostPublishManualSharing from '../post-publish-manual-sharing';
import PostPublishReviewPrompt from '../post-publish-review-prompt';

const PostPublishPanels = () => {
	return (
		<ThemeProvider>
			<PostPublishManualSharing />
			<PostPublishReviewPrompt />
		</ThemeProvider>
	);
};

export default PostPublishPanels;
