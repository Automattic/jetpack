import VideoStorageMeter from '..';
import Doc from './VideoStorageMeter.mdx';
import type { ComponentStory, ComponentMeta } from '@storybook/react';

export default {
	title: 'Packages/VideoPress/Video Storage Meter',
	component: VideoStorageMeter,
	parameters: {
		docs: {
			page: Doc,
		},
	},
} as ComponentMeta< typeof VideoStorageMeter >;

const Template: ComponentStory< typeof VideoStorageMeter > = args => (
	<VideoStorageMeter { ...args } />
);

export const _default = Template.bind( {} );
_default.args = {
	total: 1024 * 1024 * 1024 * 1024, // 1 TiB
	used: ( 1024 * 1024 * 1024 * 1024 ) / 2, // 50%
};
