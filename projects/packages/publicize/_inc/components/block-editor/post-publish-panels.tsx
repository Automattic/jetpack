import { ThemeProvider } from '@automattic/jetpack-components';
import { isSimpleSite } from '@automattic/jetpack-script-data';
import PostPublishManualSharing from '../post-publish-manual-sharing';
import PostPublishReviewPrompt from '../post-publish-review-prompt';
import { PostPublishShareStatus } from '../post-publish-share-status';

const PostPublishPanels = () => {
	return (
		<ThemeProvider targetDom={ document.body }>
			{ ! isSimpleSite() && <PostPublishReviewPrompt /> }
			<PostPublishShareStatus />
			<PostPublishManualSharing />
		</ThemeProvider>
	);
};

export default PostPublishPanels;
