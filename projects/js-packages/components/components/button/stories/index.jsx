/**
 * External dependencies
 */
import React from 'react';

/**
 * Internal dependencies
 */
import Button from '../index.jsx';

export default {
	title: 'JS Packages/Components/Button',
	component: Button,
	argTypes: {
		icon: {
			control: false,
		},
	},
	parameters: {
		backgrounds: {
			default: 'Light',
		},
	},
};

const VariantDisabled = {
	variant: {
		control: false,
	},
};

const Template = args => <Button { ...args } />;

export const ButtonPrimary = Template.bind( {} );
ButtonPrimary.argTypes = VariantDisabled;
ButtonPrimary.args = {
	size: 'normal',
	children: 'Jetpack Button',
	variant: 'primary',
};

export const ButtonSecondary = Template.bind( {} );
ButtonSecondary.argTypes = VariantDisabled;
ButtonSecondary.args = {
	size: 'normal',
	children: 'Jetpack Button',
	variant: 'secondary',
};

export const ButtonLink = Template.bind( {} );
ButtonLink.argTypes = VariantDisabled;
ButtonLink.args = {
	size: 'normal',
	children: 'Jetpack Button',
	variant: 'link',
};

const DownIcon = () => (
	<svg width="15" height="9" fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="10 9 4 7">
		<path
			fillRule="evenodd"
			clipRule="evenodd"
			d="m18.004 10.555-6.005 5.459-6.004-5.459 1.009-1.11 4.995 4.542 4.996-4.542 1.009 1.11Z"
		/>
	</svg>
);

export const Icon = Template.bind( {} );
Icon.args = {
	size: 'normal',
	children: 'Jetpack Button',
	icon: <DownIcon />,
	variant: 'primary',
};

export const Disabled = Template.bind( {} );
Disabled.argTypes = {
	disabled: {
		control: false,
	},
};
Disabled.args = {
	size: 'normal',
	children: 'Jetpack Button',
	variant: 'primary',
	disabled: true,
};
