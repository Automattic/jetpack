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
	const lastThirtyArgs = {
		icon: <Icon icon={ shield } />,
		label: 'Blocked requests',
		period: 'Last 30 days',
		value: 15,
		variant: 'square',
		disabled: false,
	};

	return <StatCard { ...lastThirtyArgs } />;
};

export const Horizontal = () => {
	const allTimeArgs = {
		icon: <Icon icon={ chartBar } />,
		label: 'Blocked requests',
		period: 'All time',
		value: 1000,
		variant: 'horizontal',
		disabled: false,
	};

	return <StatCard { ...allTimeArgs } />;
};

export const Disabled = () => {
	const lastThirtyArgs = {
		icon: <Icon icon={ shield } />,
		label: 'Blocked requests',
		period: 'Last 30 days',
		value: 0,
		variant: 'square',
		disabled: true,
	};

	return <StatCard { ...lastThirtyArgs } />;
};
