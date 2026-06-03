/**
 * External dependencies
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { subDays, startOfDay, endOfDay } from 'date-fns';
import { privateApis as componentsPrivateApis } from '@wordpress/components';
import { unlock } from '@automattic/admin-toolkit';
import type { PrimaryPresetId } from '@next-woo-analytics/datetime';

/**
 * Internal dependencies
 */
import { DateRangePresets } from '../date-range-presets';
import type { DateRange } from '../../date-range-popover';

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const { Menu } = unlock( componentsPrivateApis );

/**
 * Timezone used in stories for consistent date calculations.
 */
const STORY_TIMEZONE = 'America/New_York';

const meta: Meta< typeof DateRangePresets > = {
	title: 'Components/DateRangePresets',
	component: DateRangePresets,
	tags: [ 'autodocs' ],
	decorators: [
		( Story ) => (
			// Menu.Group must be wrapped in a Menu to work correctly in Storybook.
			<Menu open={ true }>
				<Story />
			</Menu>
		),
	],
};

export default meta;

type Story = StoryObj< typeof DateRangePresets >;

const today = new Date();

function DateRangePresetsWithState( {
	initialPrimaryPresetId = 'last-7-days',
}: {
	initialPrimaryPresetId?: PrimaryPresetId;
} ) {
	const [ presetId, setPrimaryPresetId ] = useState< PrimaryPresetId >(
		initialPrimaryPresetId
	);
	const [ , setRange ] = useState< DateRange >( {
		from: startOfDay( subDays( today, 7 ) ),
		to: endOfDay( subDays( today, 1 ) ),
	} );

	const handleChange = (
		nextRange: DateRange,
		nextPrimaryPresetId: PrimaryPresetId
	) => {
		setRange( nextRange );
		setPrimaryPresetId( nextPrimaryPresetId );
	};

	return (
		<DateRangePresets
			value={ presetId }
			onRangeChange={ handleChange }
			timeZone={ STORY_TIMEZONE }
		/>
	);
}

export const Default: Story = {
	render: () => <DateRangePresetsWithState />,
};

/**
 * `Today` preset selected.
 */
export const TodaySelected: Story = {
	render: () => <DateRangePresetsWithState initialPrimaryPresetId="today" />,
};

/**
 * `Custom` preset selected.
 */
export const CustomSelected: Story = {
	render: () => <DateRangePresetsWithState initialPrimaryPresetId="custom" />,
};

/**
 * No preset selected.
 */
export const NoSelection: Story = {
	render: () => {
		const [ presetId, setPrimaryPresetId ] =
			useState< PrimaryPresetId | null >( null );
		const [ , setRange ] = useState< DateRange | null >( null );

		const handleChange = (
			nextRange: DateRange,
			nextPrimaryPresetId: PrimaryPresetId
		) => {
			setRange( nextRange );
			setPrimaryPresetId( nextPrimaryPresetId );
		};

		return (
			<DateRangePresets
				value={ presetId }
				onRangeChange={ handleChange }
				timeZone={ STORY_TIMEZONE }
			/>
		);
	},
};
