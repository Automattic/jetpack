import { action } from '@storybook/addon-actions';
import VideoQuickActions from '..';
import type { StoryFn, Meta } from '@storybook/react';

export default {
	title: 'Packages/VideoPress/Video Quick Actions',
	component: VideoQuickActions,
	parameters: {
		layout: 'centered',
	},
} as Meta< typeof VideoQuickActions >;

const Template: StoryFn< typeof VideoQuickActions > = args => {
	return <VideoQuickActions { ...args } />;
};

export const _default = Template.bind( {} );
_default.args = {
	onUpdateVideoThumbnail: action( 'onUpdateVideoThumbnail' ),
	onUpdateVideoPrivacy: action( 'onUpdateVideoPrivacy' ),
	onDeleteVideo: action( 'onDeleteVideo' ),
};
