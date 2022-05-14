/**
 * External dependencies
 */
import * as allIcons from '@wordpress/icons';

/**
 * Internal dependencies
 */
import Button from '../index';
import Doc from './Button.mdx';

const { Icon: WPIcon, ...icons } = allIcons;
const { check } = icons;

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

const disableClassName = {
	className: {
		table: {
			disable: true,
		},
	},
};

export default {
	title: 'JS Packages/Components/Button',
	component: Button,
	argTypes: {
		icon: {
			control: {
				type: 'select',
				options: [ 'none', ...Object.keys( icons ) ],
			},
		},
	},
	parameters: {
		backgrounds: {
			default: 'Jetpack Dashboard',
		},
		docs: {
			page: Doc,
		},
	},
};

const DefaultTemplate = args => {
	const icon = args?.icon && args?.icon !== 'none' ? <WPIcon icon={ icons[ args.icon ] } /> : null;
	return <Button { ...args } icon={ icon } />;
};

export const _default = DefaultTemplate.bind( {} );
_default.args = {
	size: 'normal',
	weight: 'bold',
	children: 'Once upon a time… a button story',
	variant: 'primary',
	isLoading: false,
	disabled: false,
	isDestructive: false,
	icon: 'cloud',
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
	...disableClassName,
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
	...disableClassName,
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
	...disableClassName,
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
	...disableClassName,
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
	...disableClassName,
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
	...disableClassName,
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
	...disableClassName,
};
Loading.args = {
	size: 'normal',
	children: 'Jetpack Button',
	variant: 'primary',
	isLoading: true,
};
