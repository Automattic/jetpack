import RecordMeterDonut, { RecordMeterDonutProps } from '../index';

export default {
	title: 'JS Packages/Components/RecordMeterDonut',
	component: RecordMeterDonut,
};

const Template = args => <RecordMeterDonut { ...args } />;

const DefaultArgs: RecordMeterDonutProps = {
	items: [ { count: 18, label: 'Posts', backgroundColor: '#00BA37' } ],
	totalCount: 100,
};

// Export Default story
export const _default = Template.bind( {} );
_default.args = DefaultArgs;
