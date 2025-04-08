import React from 'react';
import AlertIcon from '../index.jsx';

export default {
	title: 'Plugins/Protect/Alert Icon',
	component: AlertIcon,
	argTypes: {
		color: {
			control: {
				type: 'color',
			},
		},
	},
};

const FooterTemplate = args => <AlertIcon { ...args } />;
export const Default = FooterTemplate.bind( {} );
