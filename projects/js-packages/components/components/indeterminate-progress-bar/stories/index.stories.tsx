import IndeterminateProgressBar from '..';
import type { ComponentStory, ComponentMeta } from '@storybook/react';

export default {
	title: 'JS Packages/Components/Indeterminate Progress Bar',
	component: IndeterminateProgressBar,
} as ComponentMeta< typeof IndeterminateProgressBar >;

const Template: ComponentStory< typeof IndeterminateProgressBar > = args => {
	return <IndeterminateProgressBar { ...args } />;
};

export const _default = Template.bind( {} );
_default.args = {};
