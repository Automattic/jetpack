import { action } from '@storybook/addon-actions';
import VideoList from '..';
import type { ComponentStory, ComponentMeta } from '@storybook/react';

export default {
	title: 'Packages/VideoPress/Video List',
	component: VideoList,
	parameters: {
		layout: 'centered',
	},
	decorators: [
		Story => (
			<div style={ { width: '95vw', maxWidth: 1000 } }>
				<Story />
			</div>
		),
	],
} as ComponentMeta< typeof VideoList >;

const Template: ComponentStory< typeof VideoList > = args => {
	return <VideoList { ...args } />;
};

export const _default = Template.bind( {} );
_default.args = {
	onClickEdit: index => {
		action( 'onClickEdit' )( index );
	},
	videos: [
		{
			id: 1,
			posterImage:
				'https://videos.files.wordpress.com/PnQvSqdF/videopress-upload-demo-7_mp4_hd_1080p.original.jpg',
			videoTitle: 'videopress-upload-demo-7-mp4',
			duration: 158633,
			plays: 200,
			uploadDate: '2022-08-15T21:16:59+0000',
			isPrivate: true,
		},
		{
			id: 2,
			posterImage:
				'https://videos.files.wordpress.com/PnQvSqdF/videopress-upload-demo-7_mp4_hd_1080p.original.jpg',
			videoTitle: 'videopress-upload-demo-7-mp4',
			duration: 158633,
			plays: 200,
			uploadDate: '2022-08-15T21:16:59+0000',
			isPrivate: true,
		},
		{
			id: 3,
			posterImage:
				'https://videos.files.wordpress.com/PnQvSqdF/videopress-upload-demo-7_mp4_hd_1080p.original.jpg',
			videoTitle: 'videopress-upload-demo-7-mp4',
			duration: 158633,
			plays: 200,
			uploadDate: '2022-08-15T21:16:59+0000',
			isPrivate: true,
		},
		{
			id: 4,
			posterImage:
				'https://videos.files.wordpress.com/PnQvSqdF/videopress-upload-demo-7_mp4_hd_1080p.original.jpg',
			videoTitle: 'videopress-upload-demo-7-mp4',
			duration: 158633,
			plays: 200,
			uploadDate: '2022-08-15T21:16:59+0000',
			isPrivate: true,
		},
		{
			id: 5,
			posterImage:
				'https://videos.files.wordpress.com/PnQvSqdF/videopress-upload-demo-7_mp4_hd_1080p.original.jpg',
			videoTitle: 'videopress-upload-demo-7-mp4',
			duration: 158633,
			plays: 200,
			uploadDate: '2022-08-15T21:16:59+0000',
			isPrivate: true,
		},
	],
	hidePrivacy: false,
	hideDuration: false,
	hidePlays: false,
	hideEditButton: false,
	hideQuickActions: false,
};
