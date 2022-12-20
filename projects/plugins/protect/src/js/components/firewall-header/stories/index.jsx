import React from 'react';
import { FirewallHeader } from '../index.jsx';

export default {
	title: 'Plugins/Protect/Firewall Header',
	component: FirewallHeader,
};

export const FirewallOn = () => {
	return (
		<FirewallHeader
			status={ 'on' }
			hasRequiredPlan={ false }
			oneDayStats={ 25 }
			thirtyDayStats={ 250 }
		/>
	);
};

export const FirewallOnPaid = () => {
	return (
		<FirewallHeader
			status={ 'on' }
			hasRequiredPlan={ true }
			oneDayStats={ 25 }
			thirtyDayStats={ 250 }
		/>
	);
};

export const FirewallOff = () => {
	return (
		<FirewallHeader
			status={ 'off' }
			hasRequiredPlan={ false }
			oneDayStats={ 25 }
			thirtyDayStats={ 250 }
		/>
	);
};

export const FirewallOffPaid = () => {
	return (
		<FirewallHeader
			status={ 'off' }
			hasRequiredPlan={ true }
			oneDayStats={ 25 }
			thirtyDayStats={ 250 }
		/>
	);
};

export const FirewallLoading = () => {
	return (
		<FirewallHeader
			status={ 'loading' }
			hasRequiredPlan={ true }
			oneDayStats={ 25 }
			thirtyDayStats={ 250 }
		/>
	);
};
