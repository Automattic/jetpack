import RecordMeterBar, { RecordMeterBarProps } from '../index';

export default {
	title: 'JS Packages/Components/RecordMeterBar',
	component: RecordMeterBar,
	argTypes: {
		sortByCount: {
			control: { type: 'select', options: [ undefined, 'ascending', 'descending' ] },
		},
	},
};

const Template = args => <RecordMeterBar { ...args } />;

const DefaultArgs: RecordMeterBarProps = {
	items: [
		{ count: 18, label: 'Posts', backgroundColor: '#00BA37' },
		{ count: 30, label: 'Plugins', backgroundColor: '#3895BA' },
		{ count: 52, label: 'Comments', backgroundColor: '#E68B28' },
		{ count: 24, label: 'Authors', backgroundColor: '#3859BA' },
	],
};

// Export Default story
export const _default = Template.bind( {} );
_default.args = DefaultArgs;

export const WithTotalCount = Template.bind( {} );
WithTotalCount.args = {
	...DefaultArgs,
	totalCount: 200,
};

export const LabelBeforeCount = Template.bind( {} );
LabelBeforeCount.args = {
	...DefaultArgs,
	showLegendLabelBeforeCount: true,
};
