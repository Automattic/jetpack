import { useState } from 'react';
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
	const [ checked, setChecked ] = useState( false );
	const onChange = current => setChecked( current );
	return <Checkbox { ...args } checked={ checked } onChange={ onChange } />;
};

export const _default = Template.bind( {} );
_default.args = {};
