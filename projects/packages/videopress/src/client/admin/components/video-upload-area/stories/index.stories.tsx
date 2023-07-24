import VideoUploadArea from '..';
import type { ComponentStory, ComponentMeta } from '@storybook/react';

export default {
	title: 'Packages/VideoPress/Video Upload Area',
	component: VideoUploadArea,
} as ComponentMeta< typeof VideoUploadArea >;

const noop = () => {
	//
};

const Template: ComponentStory< typeof VideoUploadArea > = args => {
	return <VideoUploadArea { ...args } onSelectFiles={ noop } />;
};

export const _default = Template.bind( {} );
