import DonutMeter, { DonutMeterProps } from '../index';

export default {
	title: 'JS Packages/Components/DonutMeter',
	component: DonutMeter,
	parameters: {
		layout: 'centered',
	},
};

const Template = args => <DonutMeter { ...args } />;

const DefaultArgs: DonutMeterProps = {
	segmentCount: 16,
	totalCount: 100,
	thickness: '3.5',
	donutWidth: '64px',
	title: 'Meter title goes here',
	description: 'Meter description goes here',
};
export const _Default = Template.bind( {} );
_Default.args = DefaultArgs;

const WarningArgs: DonutMeterProps = {
	...DefaultArgs,
	type: 'warning',
};
export const Warning = Template.bind( {} );
Warning.args = WarningArgs;

const DangerArgs: DonutMeterProps = {
	...DefaultArgs,
	type: 'danger',
};
export const Danger = Template.bind( {} );
Danger.args = DangerArgs;

export const AdaptiveColors = () => (
	<div>
		<div style={ { display: 'flex', flexFlow: 'row' } }>
			<DonutMeter { ...DefaultArgs } segmentCount={ 0 } useAdaptiveColors />
			<DonutMeter { ...DefaultArgs } segmentCount={ 20 } useAdaptiveColors />
			<DonutMeter { ...DefaultArgs } segmentCount={ 40 } useAdaptiveColors />
			<DonutMeter { ...DefaultArgs } segmentCount={ 60 } useAdaptiveColors />
			<DonutMeter { ...DefaultArgs } segmentCount={ 80 } useAdaptiveColors />
			<DonutMeter { ...DefaultArgs } segmentCount={ 100 } useAdaptiveColors />
		</div>
		<p>Color changing according to the fullness of the meter.</p>
	</div>
);
