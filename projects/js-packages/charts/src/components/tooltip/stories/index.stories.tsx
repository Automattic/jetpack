import BarChart from '../../bar-chart';
import { Tooltip } from '../index';
import type { Meta } from '@storybook/react';

export default {
	title: 'JS Packages/Charts/Tooltip',
	component: Tooltip,
	parameters: {
		layout: 'centered',
	},
} satisfies Meta< typeof Tooltip >;

const Template = args => (
	<div style={ { position: 'relative', padding: '2rem' } }>
		<BarChart width={ 500 } height={ 300 } showTooltips={ true } { ...args } />
	</div>
);

export const Default = Template.bind( {} );
Default.args = {
	data: [
		{ label: 'Normal Bar', value: 420 },
		{ label: 'Very Long Label That Might Need Special Handling', value: 650 },
		{ label: 'Big Number', value: 850 },
		{ label: 'Small Number', value: 123 },
	],
};
