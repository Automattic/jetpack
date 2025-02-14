import ThreatFixerButton from '../index.js';

export default {
	title: 'JS Packages/Components/Threat Fixer Button',
	component: ThreatFixerButton,
	decorators: [
		Story => (
			<div style={ { height: '175px' } }>
				<Story />
			</div>
		),
	],
	parameters: {
		layout: 'centered',
	},
};

export const Default = args => <ThreatFixerButton { ...args } />;
Default.args = {
	threat: { fixable: { fixer: 'edit' } },
	onClick: () => alert( 'Fixer callback triggered' ), // eslint-disable-line no-alert
};

export const DeletePlugin = args => <ThreatFixerButton { ...args } />;
DeletePlugin.args = {
	threat: { fixable: { fixer: 'delete' }, extension: { type: 'plugins' } },
	onClick: () => alert( 'Delete fixer callback triggered' ), // eslint-disable-line no-alert
};

export const DeleteTheme = args => <ThreatFixerButton { ...args } />;
DeleteTheme.args = {
	threat: { fixable: { fixer: 'delete' }, extension: { type: 'themes' } },
	onClick: () => alert( 'Delete fixer callback triggered' ), // eslint-disable-line no-alert
};

export const DeleteDirectory = args => <ThreatFixerButton { ...args } />;
DeleteDirectory.args = {
	threat: { fixable: { fixer: 'delete' }, filename: '/var/www/html/wp-content/uploads/' },
	onClick: () => alert( 'Delete fixer callback triggered' ), // eslint-disable-line no-alert
};

export const DeleteCoreFile = args => <ThreatFixerButton { ...args } />;
DeleteCoreFile.args = {
	threat: {
		fixable: { fixer: 'delete' },
		signature: 'Core.File.Modification',
		filename: '/var/www/html/wp-admin/index.php',
	},
	onClick: () => alert( 'Delete fixer callback triggered' ), // eslint-disable-line no-alert
};

export const DeleteFile = args => <ThreatFixerButton { ...args } />;
DeleteFile.args = {
	threat: {
		fixable: { fixer: 'delete' },
		filename: '/var/www/html/wp-content/uploads/jptt_eicar.php',
	},
	onClick: () => alert( 'Delete fixer callback triggered' ), // eslint-disable-line no-alert
};

export const Update = args => <ThreatFixerButton { ...args } />;
Update.args = {
	threat: { fixable: { fixer: 'update' } },
	onClick: () => alert( 'Update fixer callback triggered' ), // eslint-disable-line no-alert
};

export const ReplaceSaltKeys = args => <ThreatFixerButton { ...args } />;
ReplaceSaltKeys.args = {
	threat: { fixable: { fixer: 'replace' }, signature: 'php_hardening_WP_Config_NoSalts_001' },
	onClick: () => alert( 'Replace fixer callback triggered' ), // eslint-disable-line no-alert
};

export const ReplaceCoreFile = args => <ThreatFixerButton { ...args } />;
ReplaceCoreFile.args = {
	threat: {
		fixable: { fixer: 'replace' },
		signature: 'Core.File.Modification',
		filename: '/var/www/html/wp-admin/index.php',
	},
	onClick: () => alert( 'Replace fixer callback triggered' ), // eslint-disable-line no-alert
};

export const ReplaceFile = args => <ThreatFixerButton { ...args } />;
ReplaceFile.args = {
	threat: {
		fixable: { fixer: 'replace' },
		filename: '/var/www/html/wp-content/uploads/jptt_eicar.php',
	},
	onClick: () => alert( 'Replace fixer callback triggered' ), // eslint-disable-line no-alert
};

export const Loading = args => <ThreatFixerButton { ...args } />;
Loading.args = {
	threat: { fixable: { fixer: 'update' }, fixer: { status: 'in_progress' } },
	onClick: () => alert( 'In progress fixer callback triggered' ), // eslint-disable-line no-alert
};

export const StaleFixer = args => <ThreatFixerButton { ...args } />;
StaleFixer.args = {
	threat: {
		fixable: { fixer: 'update' },
		fixer: { status: 'in_progress', lastUpdated: new Date( '1999-01-01' ).toISOString() },
	},
	onClick: () => alert( 'Stale fixer callback triggered.' ), // eslint-disable-line no-alert
};

export const ErrorFixer = args => <ThreatFixerButton { ...args } />;
ErrorFixer.args = {
	threat: { fixable: { fixer: 'update' }, fixer: { error: 'error' } },
	onClick: () => alert( 'Error fixer callback triggered.' ), // eslint-disable-line no-alert
};
