/**
 * External dependencies
 */
import React from 'react';
import { Icon as WPIcon, check } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import Button from '../index.jsx';
import Doc from './Button.mdx';

const DisableVariant = {
	variant: {
		table: {
			disable: true,
		},
	},
};

const DisableDisabled = {
	disabled: {
		table: {
			disable: true,
		},
	},
};

const DisableIsDestructive = {
	isDestructive: {
		table: {
			disable: true,
		},
	},
};

const DisableIsLoading = {
	isLoading: {
		table: {
			disable: true,
		},
	},
};

const DisableIcon = {
	icon: {
		table: {
			disable: true,
		},
	},
};

export default {
	title: 'JS Packages/Components/Button',
	component: Button,
	argTypes: {
		className: {
			table: {
				disable: true,
			},
		},
	},
	parameters: {
		backgrounds: {
			default: 'Light',
		},
		docs: {
			page: Doc,
		},
	},
};

const Template = args => <Button { ...args } />;

export const ButtonPrimary = Template.bind( {} );
ButtonPrimary.argTypes = {
	...DisableVariant,
	...DisableDisabled,
	...DisableIcon,
	...DisableIsLoading,
	...DisableIsDestructive,
};
ButtonPrimary.args = {
	size: 'normal',
	children: 'Jetpack Button',
	variant: 'primary',
};

export const ButtonSecondary = Template.bind( {} );
ButtonSecondary.argTypes = {
	...DisableVariant,
	...DisableDisabled,
	...DisableIcon,
	...DisableIsLoading,
	...DisableIsDestructive,
};
ButtonSecondary.args = {
	size: 'normal',
	children: 'Jetpack Button',
	variant: 'secondary',
};

export const ButtonLink = Template.bind( {} );
ButtonLink.argTypes = {
	...DisableVariant,
	...DisableDisabled,
	...DisableIcon,
	...DisableIsLoading,
	...DisableIsDestructive,
};
ButtonLink.args = {
	size: 'normal',
	children: 'Jetpack Button',
	variant: 'link',
};

export const ButtonExternalLink = Template.bind( {} );
ButtonExternalLink.argTypes = {
	...DisableVariant,
	...DisableDisabled,
	...DisableIcon,
	...DisableIsLoading,
	...DisableIsDestructive,
};
ButtonExternalLink.args = {
	size: 'normal',
	children: 'Jetpack Button',
	variant: 'external-link',
};

export const Icon = Template.bind( {} );
Icon.argTypes = {
	...DisableIcon,
	...DisableDisabled,
	...DisableIsLoading,
	...DisableIsDestructive,
};
Icon.args = {
	size: 'normal',
	children: 'Jetpack Button',
	icon: <WPIcon icon={ check } />,
	variant: 'primary',
};

export const Disabled = Template.bind( {} );
Disabled.argTypes = {
	...DisableDisabled,
	...DisableIsDestructive,
	...DisableIsLoading,
};
Disabled.args = {
	size: 'normal',
	children: 'Jetpack Button',
	variant: 'primary',
	disabled: true,
};

export const Destructive = Template.bind( {} );
Destructive.argTypes = {
	...DisableIsDestructive,
	...DisableIsLoading,
	...DisableDisabled,
};
Destructive.args = {
	size: 'normal',
	children: 'Jetpack Button',
	variant: 'primary',
	isDestructive: true,
};

export const Loading = Template.bind( {} );
Loading.argTypes = {
	...DisableIsDestructive,
	...DisableIsLoading,
	...DisableDisabled,
};
Loading.args = {
	size: 'normal',
	children: 'Jetpack Button',
	variant: 'primary',
	isLoading: true,
};
