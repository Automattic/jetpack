import { action } from '@storybook/addon-actions';
import VideoQuickActions from '..';
import type { ComponentStory, ComponentMeta } from '@storybook/react';

export default {
	title: 'Packages/VideoPress/Video Quick Actions',
	component: VideoQuickActions,
	parameters: {
		layout: 'centered',
	},
} as ComponentMeta< typeof VideoQuickActions >;

const Template: ComponentStory< typeof VideoQuickActions > = args => {
	return <VideoQuickActions { ...args } />;
};

export const _default = Template.bind( {} );
_default.args = {
	onUpdateVideoThumbnail: action( 'onUpdateVideoThumbnail' ),
	onUpdateVideoPrivacy: action( 'onUpdateVideoPrivacy' ),
	onDeleteVideo: action( 'onDeleteVideo' ),
};
