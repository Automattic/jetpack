import { useState } from 'react';
import { DateIntervalDropdown } from '../date-interval-dropdown';
import type { IntervalType } from '@jetpack-premium-analytics/datetime';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta< typeof DateIntervalDropdown > = {
	title: 'Packages/Premium Analytics/UI/DateIntervalDropdown',
	component: DateIntervalDropdown,
	tags: [ 'autodocs' ],
	parameters: {
		docs: {
			description: {
				component:
					'The bucket size every chart on the page draws. The trigger is a glyph, so ' +
					'the menu is the only place the choice can be inspected: a range with a ' +
					'single allowed bucket still opens one, listing it checked.\n\n' +
					'The options are a prop, derived upstream from the active range — the ' +
					'consumer passes `getAllowedIntervalsForPreset()` rather than a fixed list, ' +
					'so the menu can never offer a bucket the range would coerce away.',
			},
		},
	},
	argTypes: {
		onChange: { control: false },
	},
};

export default meta;

type Story = StoryObj< typeof DateIntervalDropdown >;

function DateIntervalDropdownWithState( {
	options,
	initialValue,
}: {
	options: readonly IntervalType[];
	initialValue: IntervalType;
} ) {
	const [ value, setValue ] = useState< IntervalType >( initialValue );

	return <DateIntervalDropdown options={ options } value={ value } onChange={ setValue } />;
}

/**
 * The `Last 30 days` range: two buckets to choose between.
 */
export const Default: Story = {
	render: () => <DateIntervalDropdownWithState options={ [ 'day', 'week' ] } initialValue="day" />,
};

/**
 * The `Last 7 days` range, which allows a single bucket. The menu still opens
 * and shows it checked, rather than hiding or disabling the control.
 */
export const SingleOption: Story = {
	render: () => <DateIntervalDropdownWithState options={ [ 'day' ] } initialValue="day" />,
};

/**
 * A multi-year range, as the year surface's `All time` produces: the buckets
 * move with the range rather than being drawn from a fixed list.
 */
export const CoarseRange: Story = {
	render: () => (
		<DateIntervalDropdownWithState options={ [ 'quarter', 'year' ] } initialValue="quarter" />
	),
};
