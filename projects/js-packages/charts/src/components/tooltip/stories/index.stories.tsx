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

/**
 * Story template for demonstrating the Tooltip component with a BarChart.
 *
 * @param {object} args - Story arguments
 * @return {JSX.Element} The rendered story
 */
function Template( args ) {
	return (
		<div style={ { width: 800, height: 400 } }>
			<BarChart
				width={ 800 }
				height={ 400 }
				data={ [
					{ label: 'Jan', value: 30 },
					{ label: 'Feb', value: 45 },
					{ label: 'Mar', value: 25 },
					{ label: 'Apr', value: 60 },
					{ label: 'May', value: 38 },
					{ label: 'Jun', value: 52 },
					{ label: 'Jul', value: 65 },
					{ label: 'Aug', value: 58 },
					{ label: 'Sep', value: 42 },
					{ label: 'Oct', value: 37 },
					{ label: 'Nov', value: 45 },
					{ label: 'Dec', value: 50 },
				] }
			/>
			<Tooltip { ...args } />
		</div>
	);
}

export const Default = Template.bind( {} );
Default.args = {
	data: {
		label: 'Example Bar',
		value: 42,
	},
};
