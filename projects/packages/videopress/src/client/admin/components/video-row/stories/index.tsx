import VideoRow from '..';
import type { ComponentStory, ComponentMeta } from '@storybook/react';

export default {
	title: 'Packages/VideoPress/Video Row',
	component: VideoRow,
	parameters: {
		layout: 'centered',
	},
} as ComponentMeta< typeof VideoRow >;

const Template: ComponentStory< typeof VideoRow > = () => {
	return (
		<div style={ { width: 1000 } }>
			<VideoRow />
		</div>
	);
};

export const _default = Template.bind( {} );
