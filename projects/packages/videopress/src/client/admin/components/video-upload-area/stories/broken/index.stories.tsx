import VideoUploadArea from '..';
import type { StoryFn, Meta } from '@storybook/react';

export default {
	title: 'Packages/VideoPress/Video Upload Area',
	component: VideoUploadArea,
} as Meta< typeof VideoUploadArea >;

const noop = () => {
	//
};

const Template: StoryFn< typeof VideoUploadArea > = args => {
	return <VideoUploadArea { ...args } onSelectFiles={ noop } />;
};

export const _default = Template.bind( {} );
