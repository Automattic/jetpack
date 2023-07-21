import { BoostScoreGraph } from '..';
import type { Meta } from '@storybook/react';

const exampleData = [
	[ 1689379200, 1689465600, 1689552000, 1689638400, 1689724800, 1689811200, 1689897600 ],
	[ 76, 81, 87, 89, 91, 94, 99 ],
	[ 72, 78, 80, 81, 5, 74, 84, 89 ],
];

const meta: Meta< typeof BoostScoreGraph > = {
	title: 'JS Packages/Components/Boost Score Graph',
	component: BoostScoreGraph,
	argTypes: {
		data: { control: 'object' },
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
	data: exampleData,
	isLoading: false,
};

export default meta;

const Template = args => <BoostScoreGraph { ...args } />;
export const _default = Template.bind( {} );
_default.args = defaultValues;
