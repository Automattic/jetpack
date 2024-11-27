/* eslint-disable react/react-in-jsx-scope */
import React from 'react';
import Alert from '../index.tsx';

export default {
	title: 'Plugins/Protect/Alert Icon',
	component: Alert,
	argTypes: {
		color: {
			control: {
				type: 'color',
			},
		},
	},
};

const FooterTemplate = args => <Alert { ...args } />;
export const Default = FooterTemplate.bind( {} );
