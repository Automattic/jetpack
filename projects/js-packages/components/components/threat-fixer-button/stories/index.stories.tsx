import ThreatFixerButton from '../index.js';

export default {
	title: 'JS Packages/Components/Threat Fixer Button',
	component: ThreatFixerButton,
};

export const Default = args => <ThreatFixerButton { ...args } />;
Default.args = {
	threat: { fixable: { fixer: 'edit' } },
	onClick: () => alert( 'Edit fixer callback triggered' ), // eslint-disable-line no-alert
};

export const Update = args => <ThreatFixerButton { ...args } />;
Update.args = {
	threat: { fixable: { fixer: 'update' } },
	onClick: () => alert( 'Update fixer callback triggered' ), // eslint-disable-line no-alert
};

export const Delete = args => <ThreatFixerButton { ...args } />;
Delete.args = {
	threat: { fixable: { fixer: 'delete' } },
	onClick: () => alert( 'Delete fixer callback triggered' ), // eslint-disable-line no-alert
};

export const Loading = args => <ThreatFixerButton { ...args } />;
Loading.args = {
	threat: { fixable: { fixer: 'edit' }, fixer: { status: 'in_progress' } },
	onClick: () => alert( 'Fixer callback triggered' ), // eslint-disable-line no-alert
};
