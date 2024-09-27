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
	hasPlan: false,
	automaticRulesAvailable: false,
	jetpackWafIpList: true,
	jetpackWafAutomaticRules: false,
	bruteForceProtectionIsEnabled: true,
	wafSupported: true,
	currentDayStats: 0,
	thirtyDaysStats: 0,
	standaloneMode: false,
};

export const FirewallOffFree = Template.bind( {} );
FirewallOffFree.args = {
	status: 'off',
	hasPlan: false,
	automaticRulesAvailable: false,
	jetpackWafIpList: false,
	jetpackWafAutomaticRules: false,
	bruteForceProtectionIsEnabled: false,
	wafSupported: true,
	currentDayStats: 0,
	thirtyDaysStats: 0,
	standaloneMode: false,
};

export const FirewallOnPaid = Template.bind( {} );
FirewallOnPaid.args = {
	status: 'on',
	hasPlan: true,
	automaticRulesAvailable: true,
	jetpackWafIpList: true,
	jetpackWafAutomaticRules: true,
	bruteForceProtectionIsEnabled: true,
	wafSupported: true,
	currentDayStats: 100,
	thirtyDaysStats: 30000,
	standaloneMode: false,
};

export const FirewallOffPaid = Template.bind( {} );
FirewallOffPaid.args = {
	status: 'off',
	hasPlan: true,
	automaticRulesAvailable: true,
	jetpackWafIpList: false,
	jetpackWafAutomaticRules: false,
	bruteForceProtectionIsEnabled: false,
	wafSupported: true,
	currentDayStats: 0,
	thirtyDaysStats: 0,
	standaloneMode: false,
};

export const FirewallOnStandalone = Template.bind( {} );
FirewallOnStandalone.args = {
	status: 'on',
	hasPlan: true,
	automaticRulesAvailable: true,
	jetpackWafIpList: true,
	jetpackWafAutomaticRules: true,
	bruteForceProtectionIsEnabled: true,
	wafSupported: true,
	currentDayStats: 100,
	thirtyDaysStats: 30000,
	standaloneMode: true,
};

export const FirewallLoading = Template.bind( {} );
FirewallLoading.args = {
	status: 'loading',
	hasPlan: true,
	automaticRulesAvailable: true,
	jetpackWafIpList: false,
	jetpackWafAutomaticRules: false,
	bruteForceProtectionIsEnabled: false,
	wafSupported: true,
	currentDayStats: 0,
	thirtyDaysStats: 0,
	standaloneMode: false,
};
