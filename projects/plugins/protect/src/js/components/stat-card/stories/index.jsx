import { Icon, shield, chartBar } from '@wordpress/icons';
import React from 'react';
import StatCard from '../index.jsx';

export default {
	title: 'Plugins/Protect/Stat Card',
	component: StatCard,
	decorators: [
		Story => (
			<div>
				<Story />
			</div>
		),
	],
};

export const Square = () => {
	const isSmall = false;
	const hasRequiredPlan = true;

	const lastThirtyArgs = {
		icon: <Icon icon={ shield } />,
		label: 'Blocked requests',
		period: 'Last 30 days',
		value: 15,
		variant: isSmall ? 'horizontal' : 'square',
		disabled: hasRequiredPlan ? false : true,
	};

	return <StatCard { ...lastThirtyArgs } />;
};

export const Horizontal = () => {
	const isSmall = true;
	const hasRequiredPlan = true;

	const allTimeArgs = {
		icon: <Icon icon={ chartBar } />,
		label: 'Blocked requests',
		period: 'All time',
		value: 1000,
		variant: isSmall ? 'horizontal' : 'square',
		disabled: hasRequiredPlan ? false : true,
	};

	return <StatCard { ...allTimeArgs } />;
};

export const Disabled = () => {
	const isSmall = false;
	const hasRequiredPlan = false;

	const lastThirtyArgs = {
		icon: <Icon icon={ shield } />,
		label: 'Blocked requests',
		period: 'Last 30 days',
		value: 0,
		variant: isSmall ? 'horizontal' : 'square',
		disabled: hasRequiredPlan ? false : true,
	};

	return <StatCard { ...lastThirtyArgs } />;
};
