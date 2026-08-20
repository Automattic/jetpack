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
					'the menu is the only place the choice can be inspected: it lists every ' +
					'bucket, always, and shows the active one checked.\n\n' +
					'`allowed` is a prop, derived upstream from the active range — the ' +
					'consumer passes `getAllowedIntervalsForPreset()` rather than a fixed list. ' +
					'Buckets outside it are listed disabled, so a range can never be made to ' +
					'draw one it would coerce away, and moving the range shows what that bought.',
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
	allowed,
	initialValue,
}: {
	allowed: readonly IntervalType[];
	initialValue: IntervalType;
} ) {
	const [ value, setValue ] = useState< IntervalType >( initialValue );

	return <DateIntervalDropdown allowed={ allowed } value={ value } onChange={ setValue } />;
}

/**
 * The `Last 30 days` range: two buckets to choose between, the coarser and
 * finer ones listed disabled around them.
 */
export const Default: Story = {
	render: () => <DateIntervalDropdownWithState allowed={ [ 'day', 'week' ] } initialValue="day" />,
};

/**
 * The `Last 7 days` range, which allows a single bucket. The menu still opens
 * and shows it checked, with every other bucket disabled around it.
 */
export const SingleOption: Story = {
	render: () => <DateIntervalDropdownWithState allowed={ [ 'day' ] } initialValue="day" />,
};

/**
 * A multi-year range, as the year surface's `All time` produces: the enabled
 * buckets move with the range rather than being drawn from a fixed list.
 */
export const CoarseRange: Story = {
	render: () => (
		<DateIntervalDropdownWithState allowed={ [ 'quarter', 'year' ] } initialValue="quarter" />
	),
};
