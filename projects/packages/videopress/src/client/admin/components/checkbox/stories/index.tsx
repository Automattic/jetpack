import { useArgs } from '@storybook/client-api';
import Checkbox from '..';
import type { ComponentStory, ComponentMeta } from '@storybook/react';

export default {
	title: 'Packages/VideoPress/Checkbox',
	component: Checkbox,
	parameters: {
		layout: 'centered',
	},
} as ComponentMeta< typeof Checkbox >;

const Template: ComponentStory< typeof Checkbox > = args => {
	const [ , updateArgs ] = useArgs();
	const onChange = current => updateArgs( { checked: current } );
	return <Checkbox { ...args } onChange={ onChange } />;
};

export const _default = Template.bind( {} );
_default.args = {
	checked: true,
};
