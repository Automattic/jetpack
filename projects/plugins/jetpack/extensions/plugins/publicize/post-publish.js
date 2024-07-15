import { PostPublishManualSharing, PostPublishReviewPrompt } from '@automattic/jetpack-publicize';

const PostPublishPanels = () => {
	return (
		<>
			<PostPublishManualSharing />
			<PostPublishReviewPrompt />
		</>
	);
};

export default PostPublishPanels;
