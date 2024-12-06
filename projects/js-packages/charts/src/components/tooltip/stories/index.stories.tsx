import { BarChart } from '../../bar-chart';
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
	<div style={ { width: 400, height: 400 } }>
		<BarChart width={ 400 } height={ 400 } data={ [ { label: 'Example', value: 42 } ] } />
		<Tooltip { ...args } />
	</div>
);

export const Default = Template.bind( {} );
Default.args = {
	data: {
		label: 'Example Bar',
		value: 42,
	},
};
