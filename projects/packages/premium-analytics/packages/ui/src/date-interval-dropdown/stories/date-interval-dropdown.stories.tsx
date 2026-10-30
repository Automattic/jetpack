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
					'The bucket size every chart on the page draws. The trigger names the active ' +
					'bucket; a range with a single allowed bucket still opens one, listing it ' +
					'checked with a line on how a longer range adds more.\n\n' +
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
	...props
}: {
	options: readonly IntervalType[];
	initialValue: IntervalType;
} & Partial< Parameters< typeof DateIntervalDropdown >[ 0 ] > ) {
	const [ value, setValue ] = useState< IntervalType >( initialValue );

	return (
		<DateIntervalDropdown { ...props } options={ options } value={ value } onChange={ setValue } />
	);
}

/**
 * The `Last 30 days` range: two buckets to choose between.
 */
export const Default: Story = {
	render: () => <DateIntervalDropdownWithState options={ [ 'day', 'week' ] } initialValue="day" />,
};

/**
 * The `Last 7 days` range, which allows a single bucket: the menu lists it checked and says how to get more.
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
		<DateIntervalDropdownWithState options={ [ 'month', 'year' ] } initialValue="month" />
	),
};

/**
 * A `Last 90 days` range on a plan that locks weekly and monthly charts: days stay open,
 * and the buckets the range would draw are listed with a lock and an upgrade.
 */
export const LockedBuckets: Story = {
	render: () => (
		<DateIntervalDropdownWithState
			options={ [ 'day' ] }
			lockedOptions={ [ 'week', 'month' ] }
			lockUpsell={ {
				description: 'Group your charts by week, month or year.',
				supportUrl: '',
				upgradeUrl: 'https://wordpress.com/plans',
			} }
			initialValue="day"
		/>
	),
};

export const UnavailableBuckets: Story = {
	render: () => (
		<DateIntervalDropdownWithState
			options={ [ 'week', 'month' ] }
			unavailableOptions={ [ 'day' ] }
			unavailableHint="Switch to the line chart to see each day."
			initialValue="week"
		/>
	),
};
