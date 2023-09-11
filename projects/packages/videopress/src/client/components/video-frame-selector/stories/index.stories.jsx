import VideoFrameSelector, { VideoPlayer as VideoPlayerComponent } from '..';

export default {
	title: 'Packages/VideoPress/Video Frame Selector',
	component: VideoFrameSelector,
	parameters: {
		layout: 'centered',
	},
	decorators: [
		Story => (
			<div style={ { width: '100%', maxWidth: '600px' } }>
				<Story />
			</div>
		),
	],
};

const Template = args => <VideoFrameSelector { ...args } />;

export const Default = Template.bind( {} );
Default.args = {
	src: 'https://videos.files.wordpress.com/PnQvSqdF/videopress-upload-demo-7.mp4',
};

const VideoPlayerTemplate = args => <VideoPlayerComponent { ...args } />;

export const VideoPlayer = VideoPlayerTemplate.bind( {} );
VideoPlayer.args = {
	src: 'https://videos.files.wordpress.com/PnQvSqdF/videopress-upload-demo-7.mp4',
};
