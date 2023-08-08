import { BoostScoreGraph } from '..';
import type { Meta } from '@storybook/react';

const exampleRawResponse = {
	data: {
		_meta: {
			start: 1689772803000,
			end: 1690647000000,
		},
		periods: [
			{
				timestamp: 1689772803,
				dimensions: {
					desktop_overall_score: 75,
					desktop_cls: {
						score: 0.92,
						value: 0.088,
					},
					desktop_tbt: {
						score: 1,
						value: 0,
					},
					desktop_fcp: {
						score: 0.25,
						value: 2.1,
					},
					desktop_si: {
						score: 0.46,
						value: 2.4,
					},
					desktop_lcp: {
						score: 0.29,
						value: 3.2,
					},
					desktop_tti: {
						score: 0.95,
						value: 2.1,
					},
					mobile_overall_score: 52,
				},
			},
			{
				timestamp: 1689859203,
				dimensions: {
					desktop_overall_score: 72,
					desktop_cls: {
						score: 0.92,
						value: 0.088,
					},
					desktop_tbt: {
						score: 1,
						value: 0,
					},
					desktop_fcp: {
						score: 0.25,
						value: 2.1,
					},
					desktop_si: {
						score: 0.46,
						value: 2.4,
					},
					desktop_lcp: {
						score: 0.29,
						value: 3.2,
					},
					desktop_tti: {
						score: 0.95,
						value: 2.1,
					},
					mobile_overall_score: 49,
				},
			},
			{
				timestamp: 1689945603,
				dimensions: {
					desktop_overall_score: 20,
					desktop_cls: {
						score: 0.92,
						value: 0.088,
					},
					desktop_tbt: {
						score: 1,
						value: 0,
					},
					desktop_fcp: {
						score: 0.25,
						value: 2.1,
					},
					desktop_si: {
						score: 0.46,
						value: 2.4,
					},
					desktop_lcp: {
						score: 0.29,
						value: 3.2,
					},
					desktop_tti: {
						score: 0.95,
						value: 2.1,
					},
					mobile_overall_score: 30,
				},
			},
			{
				timestamp: 1690032003,
				dimensions: {
					desktop_overall_score: 72,
					desktop_cls: {
						score: 0.92,
						value: 0.088,
					},
					desktop_tbt: {
						score: 1,
						value: 0,
					},
					desktop_fcp: {
						score: 0.25,
						value: 2.1,
					},
					desktop_si: {
						score: 0.46,
						value: 2.4,
					},
					desktop_lcp: {
						score: 0.29,
						value: 3.2,
					},
					desktop_tti: {
						score: 0.95,
						value: 2.1,
					},
					mobile_overall_score: 40,
				},
			},
			{
				timestamp: 1690118403,
				dimensions: {
					desktop_overall_score: 55,
					desktop_cls: {
						score: 0.92,
						value: 0.088,
					},
					desktop_tbt: {
						score: 1,
						value: 0,
					},
					desktop_fcp: {
						score: 0.25,
						value: 2.1,
					},
					desktop_si: {
						score: 0.46,
						value: 2.4,
					},
					desktop_lcp: {
						score: 0.29,
						value: 3.2,
					},
					desktop_tti: {
						score: 0.95,
						value: 2.1,
					},
					mobile_overall_score: 45,
				},
			},
			{
				timestamp: 1690204803,
				dimensions: {
					desktop_overall_score: 75,
					desktop_cls: {
						score: 0.92,
						value: 0.088,
					},
					desktop_tbt: {
						score: 1,
						value: 0,
					},
					desktop_fcp: {
						score: 0.25,
						value: 2.1,
					},
					desktop_si: {
						score: 0.46,
						value: 2.4,
					},
					desktop_lcp: {
						score: 0.29,
						value: 3.2,
					},
					desktop_tti: {
						score: 0.95,
						value: 2.1,
					},
					mobile_overall_score: 52,
				},
			},
			{
				timestamp: 1690291203,
				dimensions: {
					desktop_overall_score: 70,
					desktop_cls: {
						score: 0.92,
						value: 0.088,
					},
					desktop_tbt: {
						score: 1,
						value: 0,
					},
					desktop_fcp: {
						score: 0.25,
						value: 2.1,
					},
					desktop_si: {
						score: 0.46,
						value: 2.4,
					},
					desktop_lcp: {
						score: 0.29,
						value: 3.2,
					},
					desktop_tti: {
						score: 0.95,
						value: 2.1,
					},
					mobile_overall_score: 50,
				},
			},
			{
				timestamp: 1690377603,
				dimensions: {
					desktop_overall_score: 75,
					desktop_cls: {
						score: 0.92,
						value: 0.088,
					},
					desktop_tbt: {
						score: 1,
						value: 0,
					},
					desktop_fcp: {
						score: 0.25,
						value: 2.1,
					},
					desktop_si: {
						score: 0.46,
						value: 2.4,
					},
					desktop_lcp: {
						score: 0.29,
						value: 3.2,
					},
					desktop_tti: {
						score: 0.95,
						value: 2.1,
					},
					mobile_overall_score: 90,
				},
			},
			{
				timestamp: 1690464003,
				dimensions: {
					desktop_overall_score: 80,
					desktop_cls: {
						score: 0.92,
						value: 0.088,
					},
					desktop_tbt: {
						score: 1,
						value: 0,
					},
					desktop_fcp: {
						score: 0.25,
						value: 2.1,
					},
					desktop_si: {
						score: 0.46,
						value: 2.4,
					},
					desktop_lcp: {
						score: 0.29,
						value: 3.2,
					},
					desktop_tti: {
						score: 0.95,
						value: 2.1,
					},
					mobile_overall_score: 60,
				},
			},
			{
				timestamp: 1690550403,
				dimensions: {
					desktop_overall_score: 85,
					desktop_cls: {
						score: 0.92,
						value: 0.088,
					},
					desktop_tbt: {
						score: 1,
						value: 0,
					},
					desktop_fcp: {
						score: 0.25,
						value: 2.1,
					},
					desktop_si: {
						score: 0.46,
						value: 2.4,
					},
					desktop_lcp: {
						score: 0.29,
						value: 3.2,
					},
					desktop_tti: {
						score: 0.95,
						value: 2.1,
					},
					mobile_overall_score: 60,
				},
			},
			{
				timestamp: 1690636803,
				dimensions: {
					desktop_overall_score: 86,
					desktop_cls: {
						score: 0.92,
						value: 0.088,
					},
					desktop_tbt: {
						score: 1,
						value: 0,
					},
					desktop_fcp: {
						score: 0.25,
						value: 2.1,
					},
					desktop_si: {
						score: 0.46,
						value: 2.4,
					},
					desktop_lcp: {
						score: 0.29,
						value: 3.2,
					},
					desktop_tti: {
						score: 0.95,
						value: 2.1,
					},
					mobile_overall_score: 52,
				},
			},
		],
	},
};

const meta: Meta< typeof BoostScoreGraph > = {
	title: 'JS Packages/Components/Boost Score Graph',
	component: BoostScoreGraph,
	argTypes: {
		startDate: { control: 'date' },
		endDate: { control: 'date' },
		title: { control: 'string', defaultValue: 'Title' },
		isLoading: { control: 'boolean', defaultValue: false },
	},
	decorators: [
		Story => (
			<div style={ { width: '80%', maxWidth: '1320px', margin: '200px auto', fontSize: '16px' } }>
				<Story />
			</div>
		),
	],
};

const defaultValues = {
	startDate: exampleRawResponse.data._meta.start,
	endDate: exampleRawResponse.data._meta.end,
	periods: exampleRawResponse.data.periods,
	isLoading: false,
};

export default meta;

const Template = args => <BoostScoreGraph { ...args } />;
export const _default = Template.bind( {} );
_default.args = defaultValues;
