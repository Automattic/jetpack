import IndeterminateProgressBar from '..';
import type { StoryFn, Meta } from '@storybook/react';

export default {
	title: 'JS Packages/Components/Indeterminate Progress Bar',
	component: IndeterminateProgressBar,
} as Meta< typeof IndeterminateProgressBar >;

const Template: StoryFn< typeof IndeterminateProgressBar > = args => {
	return <IndeterminateProgressBar { ...args } />;
};

export const _default = Template.bind( {} );
_default.args = {};
