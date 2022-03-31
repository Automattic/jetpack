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

export const ButtonExternalLink = Template.bind( {} );
ButtonExternalLink.argTypes = VariantDisabled;
ButtonExternalLink.args = {
	size: 'normal',
	children: 'Jetpack Button',
	variant: 'external-link',
};

export const Icon = Template.bind( {} );
Icon.args = {
	size: 'normal',
	children: 'Jetpack Button',
	icon: 'check',
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

export const Destructive = Template.bind( {} );
Destructive.argTypes = {
	isDestructive: {
		control: false,
	},
};
Destructive.args = {
	size: 'normal',
	children: 'Jetpack Button',
	variant: 'primary',
	isDestructive: true,
};
