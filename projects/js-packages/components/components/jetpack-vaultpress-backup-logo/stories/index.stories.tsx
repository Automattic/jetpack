import JetpackVaultPressBackupLogo from '../index.js';
import type { StoryFn, Meta } from '@storybook/react';

const meta: Meta< typeof JetpackVaultPressBackupLogo > = {
	title: 'JS Packages/Components/Jetpack VaultPress Backup Logo',
	component: JetpackVaultPressBackupLogo,
	argTypes: {},
};

export default meta;

const Template: StoryFn< typeof JetpackVaultPressBackupLogo > = args => (
	<JetpackVaultPressBackupLogo { ...args } />
);

const DefaultArgs = {
	width: 150,
	className: 'sample-classname',
};

export const _default = Template.bind( {} );
_default.args = DefaultArgs;
