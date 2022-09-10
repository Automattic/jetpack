import DonutMeter, { DonutMeterProps } from '../index';

export default {
	title: 'JS Packages/Components/DonutMeter',
	component: DonutMeter,
};

const Template = args => <DonutMeter { ...args } />;

const DefaultArgs: DonutMeterProps = {
	segmentCount: 18,
	totalCount: 100,
	backgroundColor: '#00BA37',
	thickness: '3.5',
	donutWidth: '64px',
};

// Export Default story
export const _default = Template.bind( {} );
_default.args = DefaultArgs;
