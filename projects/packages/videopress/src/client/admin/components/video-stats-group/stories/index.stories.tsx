import VideoStatsGroup from '..';
import type { StoryFn, Meta } from '@storybook/react';

export default {
	title: 'Packages/VideoPress/Video Stats Group',
	component: VideoStatsGroup,
} as Meta< typeof VideoStatsGroup >;

const Template: StoryFn< typeof VideoStatsGroup > = args => <VideoStatsGroup { ...args } />;

export const _default = Template.bind( {} );
_default.args = {
	videos: 15,
	plays: 1234,
	playsToday: 140,
};
