import React from 'react';
import ShieldIcon from '../index';

export default {
	title: 'Plugins/Protect/Sheild Icon',
	component: ShieldIcon,
	parameters: {
		layout: 'centered',
	},
	decorators: [
		Story => (
			<div style={ { height: '72px', width: '72px' } }>
				<Story />
			</div>
		),
	],
	argTypes: {
		variant: {
			control: {
				type: 'select',
			},
			options: [
				'default',
				'success',
				'error',
				'default-outline',
				'success-outline',
				'error-outline',
			],
		},
		fill: {
			control: 'color',
		},
	},
};

export const Default = args => <ShieldIcon { ...args } />;
Default.args = {
	variant: 'default',
};

export const SuccessVariant = args => <ShieldIcon { ...args } />;
SuccessVariant.args = {
	variant: 'success',
};

export const ErrorVariant = args => <ShieldIcon { ...args } />;
ErrorVariant.args = {
	variant: 'error',
};
