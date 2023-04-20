import VideoStorageMeter from '..';
import type { ComponentStory, ComponentMeta } from '@storybook/react';

export default {
	title: 'Packages/VideoPress/Video Storage Meter',
	component: VideoStorageMeter,
} as ComponentMeta< typeof VideoStorageMeter >;

const Template: ComponentStory< typeof VideoStorageMeter > = args => (
	<VideoStorageMeter { ...args } />
);

export const _default = Template.bind( {} );
_default.args = {
	total: 1024 * 1024 * 1024 * 1024, // 1 TiB
	used: ( 1024 * 1024 * 1024 * 1024 ) / 2, // 50%
};
