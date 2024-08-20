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
	hasPlan: false,
};

export const FirewallOnPaid = Template.bind( {} );
FirewallOnPaid.args = {
	status: 'on',
	hasPlan: true,
};

export const FirewallOff = Template.bind( {} );
FirewallOff.args = {
	status: 'off',
	hasPlan: false,
};

export const FirewallOffPaid = Template.bind( {} );
FirewallOffPaid.args = {
	status: 'off',
	hasPlan: true,
};

export const FirewallLoading = Template.bind( {} );
FirewallLoading.args = {
	status: 'loading',
	hasPlan: true,
};
