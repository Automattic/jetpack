import React from 'react';
import Chip from '../index';

export default {
	title: 'JS Packages/Components/Chip',
	component: Chip,
	argTypes: {
		type: {
			control: {
				type: 'select',
			},
			options: [ 'info', 'new' ],
		},
	},
};

const Template = args => <Chip { ...args } />;

export const _default = Template.bind( {} );
_default.args = {
	type: 'new',
	text: 'new',
};
