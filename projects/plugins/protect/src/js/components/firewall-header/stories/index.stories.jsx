import React from 'react';
import { FirewallHeader } from '../index.jsx';

export default {
	title: 'Plugins/Protect/Firewall Header',
	component: FirewallHeader,
};

const Template = args => <FirewallHeader { ...args } />;

export const FirewallOn = Template.bind( {} );
FirewallOn.args = {
	status: 'on',
	hasRequiredPlan: false,
};

export const FirewallOnPaid = Template.bind( {} );
FirewallOnPaid.args = {
	status: 'on',
	hasRequiredPlan: true,
};

export const FirewallOff = Template.bind( {} );
FirewallOff.args = {
	status: 'off',
	hasRequiredPlan: false,
};

export const FirewallOffPaid = Template.bind( {} );
FirewallOffPaid.args = {
	status: 'off',
	hasRequiredPlan: true,
};

export const FirewallLoading = Template.bind( {} );
FirewallLoading.args = {
	status: 'loading',
	hasRequiredPlan: true,
};
