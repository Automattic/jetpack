import JetpackVaultPressBackupLogo from '../index';
import type { StoryFn, Meta } from '@storybook/react';

export default {
	title: 'JS Packages/Components/Jetpack VaultPress Backup Logo',
	component: JetpackVaultPressBackupLogo,
	argTypes: {},
} as Meta< typeof JetpackVaultPressBackupLogo >;

const Template: StoryFn< typeof JetpackVaultPressBackupLogo > = args => (
	<JetpackVaultPressBackupLogo { ...args } />
);

const DefaultArgs = {
	width: 150,
	className: 'sample-classname',
};

export const _default = Template.bind( {} );
_default.args = DefaultArgs;
