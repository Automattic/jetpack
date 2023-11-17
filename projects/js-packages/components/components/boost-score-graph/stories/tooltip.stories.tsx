import { Tooltip } from '../tooltip';
import type { Meta } from '@storybook/react';

const meta: Meta< typeof Tooltip > = {
	title: 'JS Packages/Components/Boost Score Tooltip',
	component: Tooltip,
	argTypes: {
		period: {
			control: 'object',
		},
	},
	decorators: [
		Story => (
			<div style={ { width: '300px', margin: '200px auto', fontSize: '16px' } }>
				<Story />
			</div>
		),
	],
};

export default meta;

const Template = args => {
	return <Tooltip { ...args } />;
};
export const _default = Template.bind( {} );
_default.args = {
	period: {
		timestamp: 1689772803000,
		dimensions: {
			desktop_overall_score: 75,
			mobile_overall_score: 52,
			desktop_cls: 0.088,
			desktop_lcp: 3.2,
			desktop_tbt: 0,
			mobile_cls: 0.088,
			mobile_lcp: 3.2,
			mobile_tbt: 0,
		},
	},
};
