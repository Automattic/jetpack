import { useArgs } from '@storybook/preview-api';
import Checkbox from '..';
import type { StoryFn, Meta } from '@storybook/react';

export default {
	title: 'Packages/VideoPress/Checkbox',
	component: Checkbox,
	parameters: {
		layout: 'centered',
	},
} as Meta< typeof Checkbox >;

const Template: StoryFn< typeof Checkbox > = args => {
	const [ , updateArgs ] = useArgs();
	const onChange = current => updateArgs( { checked: current } );
	return <Checkbox { ...args } onChange={ onChange } />;
};

export const _default = Template.bind( {} );
_default.args = {
	checked: true,
};
