import { BoostScoreGraph } from '..';
import type { Meta } from '@storybook/react';

const exampleRawResponse = {
	data: {
		_meta: {
			start: 1687802957811,
			end: 1690394957811,
		},
		periods: [
			{
				timestamp: 1689686403,
				dimensions: {
					desktop_overall_score: 67,
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
					mobile_overall_score: 77,
					mobile_cls: {
						score: 0.99,
						value: 0.047,
					},
					mobile_tbt: {
						score: 1,
						value: 0,
					},
					mobile_fcp: {
						score: 0.52,
						value: 2.9,
					},
					mobile_si: {
						score: 0.71,
						value: 4.6,
					},
					mobile_lcp: {
						score: 0.38,
						value: 4.5,
					},
					mobile_tti: {
						score: 0.96,
						value: 2.9,
					},
				},
			},
			{
				timestamp: 1690022402,
				dimensions: {
					desktop_lcp: {
						value: 3.2,
						score: 0.3,
					},
					desktop_tbt: {
						value: 0,
						score: 1,
					},
					desktop_fcp: {
						value: 1.5,
						score: 0.53,
					},
					desktop_overall_score: 72,
					desktop_cls: {
						value: 0.088,
						score: 0.92,
					},
					desktop_tti: {
						value: 1.5,
						score: 0.99,
					},
					desktop_si: {
						value: 1.9,
						score: 0.66,
					},
					mobile_lcp: {
						value: 3.7,
						score: 0.57,
					},
					mobile_tbt: {
						value: 0,
						score: 1,
					},
					mobile_fcp: {
						value: 2.3,
						score: 0.74,
					},
					mobile_overall_score: 83,
					mobile_cls: {
						value: 0.047,
						score: 0.99,
					},
					mobile_tti: {
						value: 2.3,
						score: 0.99,
					},
					mobile_si: {
						value: 4.9,
						score: 0.65,
					},
				},
			},
			{
				timestamp: 1690143992,
				dimensions: {
					desktop_fcp: {
						score: 0.52,
						value: 1.6,
					},
					desktop_tbt: {
						score: 1,
						value: 0,
					},
					desktop_overall_score: 72,
					desktop_tti: {
						score: 0.99,
						value: 1.6,
					},
					desktop_cls: {
						score: 0.92,
						value: 0.088,
					},
					desktop_lcp: {
						score: 0.3,
						value: 3.2,
					},
					desktop_si: {
						score: 0.63,
						value: 2,
					},
					mobile_fcp: {
						score: 0.56,
						value: 2.8,
					},
					mobile_tbt: {
						score: 1,
						value: 0,
					},
					mobile_overall_score: 72,
					mobile_tti: {
						score: 0.97,
						value: 2.8,
					},
					mobile_cls: {
						score: 0.99,
						value: 0.047,
					},
					mobile_lcp: {
						score: 0.24,
						value: 5.1,
					},
					mobile_si: {
						score: 0.6,
						value: 5.2,
					},
				},
			},
			{
				timestamp: 1690171549,
				dimensions: {
					desktop_fcp: {
						score: 0.54,
						value: 1.5,
					},
					desktop_cls: {
						score: 0.92,
						value: 0.088,
					},
					desktop_lcp: {
						score: 0.31,
						value: 3.1,
					},
					desktop_si: {
						score: 0.61,
						value: 2,
					},
					desktop_tti: {
						score: 0.99,
						value: 1.5,
					},
					desktop_overall_score: 72,
					desktop_tbt: {
						score: 1,
						value: 0,
					},
					mobile_fcp: {
						score: 0.6,
						value: 2.7,
					},
					mobile_cls: {
						score: 0.99,
						value: 0.047,
					},
					mobile_lcp: {
						score: 0.45,
						value: 4.2,
					},
					mobile_si: {
						score: 0.58,
						value: 5.3,
					},
					mobile_tti: {
						score: 0.97,
						value: 2.7,
					},
					mobile_overall_score: 78,
					mobile_tbt: {
						score: 1,
						value: 0,
					},
				},
			},
			{
				timestamp: 1690197123,
				dimensions: {
					desktop_fcp: {
						score: 0.26,
						value: 2.1,
					},
					desktop_tbt: {
						score: 1,
						value: 0,
					},
					desktop_lcp: {
						score: 0.3,
						value: 3.2,
					},
					desktop_si: {
						score: 0.49,
						value: 2.3,
					},
					desktop_tti: {
						score: 0.95,
						value: 2.1,
					},
					desktop_cls: {
						score: 0.92,
						value: 0.088,
					},
					desktop_overall_score: 68,
					mobile_fcp: {
						score: 0.48,
						value: 3,
					},
					mobile_tbt: {
						score: 1,
						value: 0,
					},
					mobile_lcp: {
						score: 0.34,
						value: 4.6,
					},
					mobile_si: {
						score: 0.64,
						value: 4.9,
					},
					mobile_tti: {
						score: 0.95,
						value: 3,
					},
					mobile_cls: {
						score: 0.99,
						value: 0.047,
					},
					mobile_overall_score: 74,
				},
			},
			{
				timestamp: 1690200322,
				dimensions: {
					desktop_fcp: {
						score: 0.55,
						value: 1.5,
					},
					desktop_tbt: {
						score: 1,
						value: 0,
					},
					desktop_lcp: {
						score: 0.33,
						value: 3,
					},
					desktop_si: {
						score: 0.66,
						value: 1.9,
					},
					desktop_tti: {
						score: 0.99,
						value: 1.5,
					},
					desktop_cls: {
						score: 0.92,
						value: 0.088,
					},
					desktop_overall_score: 73,
					mobile_fcp: {
						score: 0.74,
						value: 2.3,
					},
					mobile_tbt: {
						score: 1,
						value: 0,
					},
					mobile_lcp: {
						score: 0.35,
						value: 4.6,
					},
					mobile_si: {
						score: 0.65,
						value: 4.9,
					},
					mobile_tti: {
						score: 0.88,
						value: 3.9,
					},
					mobile_cls: {
						score: 0.99,
						value: 0.047,
					},
					mobile_overall_score: 77,
				},
			},
			{
				timestamp: 1690200278,
				dimensions: {
					desktop_fcp: {
						score: 0.33,
						value: 1.9,
					},
					desktop_tbt: {
						score: 1,
						value: 0,
					},
					desktop_overall_score: 70,
					desktop_tti: {
						score: 0.96,
						value: 1.9,
					},
					desktop_cls: {
						score: 0.92,
						value: 0.088,
					},
					desktop_lcp: {
						score: 0.35,
						value: 2.9,
					},
					desktop_si: {
						score: 0.54,
						value: 2.2,
					},
					mobile_fcp: {
						score: 0.56,
						value: 2.8,
					},
					mobile_tbt: {
						score: 1,
						value: 0,
					},
					mobile_overall_score: 78,
					mobile_tti: {
						score: 0.96,
						value: 2.9,
					},
					mobile_cls: {
						score: 0.99,
						value: 0.047,
					},
					mobile_lcp: {
						score: 0.39,
						value: 4.4,
					},
					mobile_si: {
						score: 0.75,
						value: 4.3,
					},
				},
			},
		],
	},
};

const meta: Meta< typeof BoostScoreGraph > = {
	title: 'JS Packages/Components/Boost Score Graph',
	component: BoostScoreGraph,
	argTypes: {
		data: { control: 'object' },
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
	periods: exampleRawResponse.data.periods,
	isLoading: false,
};

export default meta;

const Template = args => <BoostScoreGraph { ...args } />;
export const _default = Template.bind( {} );
_default.args = defaultValues;
