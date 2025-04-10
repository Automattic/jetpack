import IndeterminateProgressBar from '../index.tsx';
import type { StoryFn, Meta } from '@storybook/react';

const meta: Meta< typeof IndeterminateProgressBar > = {
	title: 'JS Packages/Components/Indeterminate Progress Bar',
	component: IndeterminateProgressBar,
};

export default meta;

const Template: StoryFn< typeof IndeterminateProgressBar > = args => {
	return <IndeterminateProgressBar { ...args } />;
};

export const _default = Template.bind( {} );
_default.args = {};
