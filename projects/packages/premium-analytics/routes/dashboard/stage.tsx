import { PieChart } from '@automattic/charts';
import { __ } from '@wordpress/i18n';
import type { DataPointPercentage } from '@automattic/charts';

const DATA: DataPointPercentage[] = [
	{ label: 'Direct', value: 4200 },
	{ label: 'Search', value: 3100 },
	{ label: 'Social', value: 1800 },
	{ label: 'Referral', value: 900 },
];

export const stage = () => {
	return (
		<div className="jetpack-premium-analytics-dashboard">
			<h1>{ __( 'Analytics', 'jetpack-premium-analytics' ) }</h1>
			<PieChart data={ DATA } size={ 300 } withTooltips />
		</div>
	);
};
