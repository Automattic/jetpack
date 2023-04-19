import JetpackVaultPressBackupLogo from '../index';
import type { ComponentStory, ComponentMeta } from '@storybook/react';

export default {
	title: 'JS Packages/Components/Jetpack VaultPress Backup Logo',
	component: JetpackVaultPressBackupLogo,
	argTypes: {},
} as ComponentMeta< typeof JetpackVaultPressBackupLogo >;

const Template: ComponentStory< typeof JetpackVaultPressBackupLogo > = args => (
	<JetpackVaultPressBackupLogo { ...args } />
);

const DefaultArgs = {
	width: 150,
	className: 'sample-classname',
};

export const _default = Template.bind( {} );
_default.args = DefaultArgs;
