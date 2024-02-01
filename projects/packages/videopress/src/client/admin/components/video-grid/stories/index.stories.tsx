import VideoGrid from '..';
import { videos } from '../../../mock';
import type { ComponentStory, ComponentMeta } from '@storybook/react';

export default {
	title: 'Packages/VideoPress/Video Grid',
	component: VideoGrid,
} as ComponentMeta< typeof VideoGrid >;

const Template: ComponentStory< typeof VideoGrid > = VideoGrid;

export const _default = Template.bind( {} );
_default.args = {
	videos: videos.map( video => ( {
		...video,
		title: video.videoTitle,
		duration: Math.floor(
			Math.random() * ( ( 3600 + 60 * 15 ) * 1000 - 25 * 1000 + 1 ) + 25 * 1000
		), // 25 seconds to 1 hour and 15 minutes
		plays: Math.floor( Math.random() * 1000000 ),
	} ) ),
	count: 6,
};
