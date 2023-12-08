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
	oneDayStats: 25,
	thirtyDayStats: 250,
};

export const FirewallOnPaid = Template.bind( {} );
FirewallOnPaid.args = {
	status: 'on',
	hasRequiredPlan: true,
	oneDayStats: 25,
	thirtyDayStats: 250,
};

export const FirewallOff = Template.bind( {} );
FirewallOff.args = {
	status: 'off',
	hasRequiredPlan: false,
	oneDayStats: 25,
	thirtyDayStats: 250,
};

export const FirewallOffPaid = Template.bind( {} );
FirewallOffPaid.args = {
	status: 'off',
	hasRequiredPlan: true,
	oneDayStats: 25,
	thirtyDayStats: 250,
};

export const FirewallLoading = Template.bind( {} );
FirewallLoading.args = {
	status: 'loading',
	hasRequiredPlan: true,
	oneDayStats: 25,
	thirtyDayStats: 250,
};
