import {
	PostPublishManualSharing,
	PostPublishReviewPrompt,
} from '@automattic/jetpack-publicize-components';

const PostPublishPanels = () => {
	return (
		<>
			<PostPublishManualSharing />
			<PostPublishReviewPrompt />
		</>
	);
};

export default PostPublishPanels;
