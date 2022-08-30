import RecordMeterDonut, { RecordMeterDonutProps } from '../index';

export default {
	title: 'JS Packages/Components/RecordMeterDonut',
	component: RecordMeterDonut,
};

const Template = args => <RecordMeterDonut { ...args } />;

const DefaultArgs: RecordMeterDonutProps = {
	segmentCount: 18,
	totalCount: 100,
	label: 'Posts',
	backgroundColor: '#00BA37',
	thickness: '3.5',
};

// Export Default story
export const _default = Template.bind( {} );
_default.args = DefaultArgs;
