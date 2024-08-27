import { ThemeProvider } from '@automattic/jetpack-components';
import { getSocialScriptData } from '../../utils/script-data';
import PostPublishManualSharing from '../post-publish-manual-sharing';
import PostPublishReviewPrompt from '../post-publish-review-prompt';
import { PostPublishShareStatus } from '../post-publish-share-status';

const PostPublishPanels = () => {
	const { feature_flags } = getSocialScriptData();
	return (
		<ThemeProvider targetDom={ document.body }>
			{ feature_flags.useShareStatus ? <PostPublishShareStatus /> : null }
			<PostPublishManualSharing />
			<PostPublishReviewPrompt />
		</ThemeProvider>
	);
};

export default PostPublishPanels;
