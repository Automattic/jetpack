import React from 'react';
import FirewallHeader from '../index.jsx';

export default {
	title: 'Plugins/Protect/Firewall Header',
	component: FirewallHeader,
};

export const FirewallOn = () => {
	return <FirewallHeader status={ 'on' } hasRequiredPlan={ false } />;
};

export const FirewallOnPaid = () => {
	return <FirewallHeader status={ 'on' } hasRequiredPlan={ true } />;
};

export const FirewallOff = () => {
	return <FirewallHeader status={ 'off' } hasRequiredPlan={ false } />;
};

export const FirewallOffPaid = () => {
	return <FirewallHeader status={ 'off' } hasRequiredPlan={ true } />;
};

export const FirewallLoading = () => {
	return <FirewallHeader status={ 'loading' } hasRequiredPlan={ true } />;
};
