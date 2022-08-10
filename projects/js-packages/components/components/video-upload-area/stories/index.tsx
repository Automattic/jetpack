import VideoUploadArea from '..';
import Doc from './VideoUploadArea.mdx';
import type { ComponentStory, ComponentMeta } from '@storybook/react';

export default {
	title: 'JS Packages/Components/Video Upload Area',
	component: VideoUploadArea,
	parameters: {
		docs: {
			page: Doc,
		},
	},
} as ComponentMeta< typeof VideoUploadArea >;

const noop = () => {
	//
};

const Template: ComponentStory< typeof VideoUploadArea > = args => (
	<VideoUploadArea { ...args } onSelectFile={ noop } />
);

export const _default = Template.bind( {} );

export const Loading = Template.bind( {} );
Loading.args = {
	isLoading: true,
};
