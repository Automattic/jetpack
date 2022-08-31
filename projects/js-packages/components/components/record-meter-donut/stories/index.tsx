import RecordMeterDonut, { RecordMeterDonutProps } from '../index';

export default {
	title: 'JS Packages/Components/RecordMeterDonut',
	component: RecordMeterDonut,
};

const Template = args => <RecordMeterDonut { ...args } />;

const DefaultArgs: RecordMeterDonutProps = {
	segmentCount: 18,
	totalCount: 100,
	backgroundColor: '#00BA37',
	thickness: '3.5',
	donutWidth: '64px',
};

// Export Default story
export const _default = Template.bind( {} );
_default.args = DefaultArgs;
