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
 * Story template for demonstrating the Tooltip component.
 *
 * @param {object} args - Story arguments
 * @return {JSX.Element} The rendered story
 */
function Template( args ) {
	return (
		<div style={ { position: 'relative', padding: '2rem', minHeight: '200px' } }>
			<Tooltip { ...args } top={ 50 } left={ 100 } />
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

export const LongLabel = Template.bind( {} );
LongLabel.args = {
	data: {
		label: 'Very Long Label That Might Need Special Handling',
		value: 1234,
	},
};

export const LargeValue = Template.bind( {} );
LargeValue.args = {
	data: {
		label: 'Big Number',
		value: 999999,
	},
};

export const SmallValue = Template.bind( {} );
SmallValue.args = {
	data: {
		label: 'Small Number',
		value: 0.123,
	},
};
