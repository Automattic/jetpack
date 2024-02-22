import React from 'react';
import { FirewallHeader } from '../index.jsx';

export default {
	title: 'Plugins/Protect/Firewall Header',
	component: FirewallHeader,
};

const Template = args => <FirewallHeader { ...args } />;

export const FirewallOnFree = Template.bind( {} );
FirewallOnFree.args = {
	status: 'on',
	hasRequiredPlan: false,
	automaticRulesAvailable: false,
	jetpackWafIpList: true,
	jetpackWafAutomaticRules: false,
	bruteForceProtectionIsEnabled: true,
	wafSupported: true,
	oneDayStats: 0,
	thirtyDayStats: 0,
	jetpackWafShareData: true,
	standaloneMode: false,
};

export const FirewallOffFree = Template.bind( {} );
FirewallOffFree.args = {
	status: 'off',
	hasRequiredPlan: false,
	automaticRulesAvailable: false,
	jetpackWafIpList: false,
	jetpackWafAutomaticRules: false,
	bruteForceProtectionIsEnabled: false,
	wafSupported: true,
	oneDayStats: 0,
	thirtyDayStats: 0,
	jetpackWafShareData: true,
	standaloneMode: false,
};

export const FirewallOnPaid = Template.bind( {} );
FirewallOnPaid.args = {
	status: 'on',
	hasRequiredPlan: true,
	automaticRulesAvailable: true,
	jetpackWafIpList: true,
	jetpackWafAutomaticRules: true,
	bruteForceProtectionIsEnabled: true,
	wafSupported: true,
	oneDayStats: 100,
	thirtyDayStats: 30000,
	jetpackWafShareData: true,
	standaloneMode: false,
};

export const FirewallOffPaid = Template.bind( {} );
FirewallOffPaid.args = {
	status: 'off',
	hasRequiredPlan: true,
	automaticRulesAvailable: true,
	jetpackWafIpList: false,
	jetpackWafAutomaticRules: false,
	bruteForceProtectionIsEnabled: false,
	wafSupported: true,
	oneDayStats: 0,
	thirtyDayStats: 0,
	jetpackWafShareData: true,
	standaloneMode: false,
};

export const FirewallOnStandalone = Template.bind( {} );
FirewallOnStandalone.args = {
	status: 'on',
	hasRequiredPlan: true,
	automaticRulesAvailable: true,
	jetpackWafIpList: true,
	jetpackWafAutomaticRules: true,
	bruteForceProtectionIsEnabled: true,
	wafSupported: true,
	oneDayStats: 100,
	thirtyDayStats: 30000,
	jetpackWafShareData: true,
	standaloneMode: true,
};

export const FirewallLoading = Template.bind( {} );
FirewallLoading.args = {
	status: 'loading',
	hasRequiredPlan: true,
	automaticRulesAvailable: true,
	jetpackWafIpList: false,
	jetpackWafAutomaticRules: false,
	bruteForceProtectionIsEnabled: false,
	wafSupported: true,
	oneDayStats: 0,
	thirtyDayStats: 0,
	jetpackWafShareData: true,
	standaloneMode: false,
};
