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

export const AdaptiveColors = args => (
	<div>
		<div style={ { display: 'flex', flexFlow: 'row' } }>
			<DonutMeter { ...args } segmentCount={ 0 } useAdaptiveColors />
			<DonutMeter { ...args } segmentCount={ 20 } useAdaptiveColors />
			<DonutMeter { ...args } segmentCount={ 40 } useAdaptiveColors />
			<DonutMeter { ...args } segmentCount={ 60 } useAdaptiveColors />
			<DonutMeter { ...args } segmentCount={ 80 } useAdaptiveColors />
			<DonutMeter { ...args } segmentCount={ 100 } useAdaptiveColors />
		</div>
		<p>Color changing according to the fullness of the meter.</p>
	</div>
);
AdaptiveColors.args = { ...DefaultArgs };
