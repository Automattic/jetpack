import ProgressBar from '..';
import Doc from './ProgressBar.mdx';
import type { ComponentStory, ComponentMeta } from '@storybook/react';

export default {
	title: 'Packages/VideoPress/Progress Bar',
	component: ProgressBar,
	parameters: {
		docs: {
			page: Doc,
		},
	},
} as ComponentMeta< typeof ProgressBar >;

const Template: ComponentStory< typeof ProgressBar > = args => {
	return <ProgressBar { ...args } />;
};

export const _default = Template.bind( {} );
_default.args = {
	progress: 0.5,
};
