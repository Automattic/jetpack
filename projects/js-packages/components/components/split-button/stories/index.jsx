/* eslint-disable react/react-in-jsx-scope */
import React from 'react';
import SplitButton from '../index.jsx';

export default {
	title: 'JS Packages/Components/Split Button',
	component: SplitButton,
	argTypes: {
		variant: { type: 'select', options: [ undefined, 'secondary', 'primary', 'tertiary', 'link' ] },
		controls: [
			{
				title: 'Deactivate',
				icon: null,
				onClick: () => {},
			},
		],
	},
	parameters: {
		backgrounds: {
			default: 'dark',
		},
	},
};

const Template = args => <SplitButton { ...args }>Buy now!</SplitButton>;

export const _default = Template.bind( {} );
