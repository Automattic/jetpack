import { privateApis as componentsPrivateApis } from '@wordpress/components';
import { subDays, startOfDay, endOfDay } from 'date-fns';
import { useState } from 'react';
import { unlock } from '../../lock/unlock';
import { DateRangePresets } from '../date-range-presets';
import type { DateRange } from '../../date-range-popover';
import type { PrimaryPresetId } from '@jetpack-premium-analytics/datetime';
import type { Meta, StoryObj } from '@storybook/react';

const { Menu } = unlock( componentsPrivateApis );

/**
 * Timezone used in stories for consistent date calculations.
 */
const STORY_TIMEZONE = 'America/New_York';

const meta: Meta< typeof DateRangePresets > = {
	title: 'Packages/Premium Analytics/UI/DateRangePresets',
	component: DateRangePresets,
	tags: [ 'autodocs' ],
	decorators: [
		Story => (
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
	const [ presetId, setPrimaryPresetId ] = useState< PrimaryPresetId >( initialPrimaryPresetId );
	const [ , setRange ] = useState< DateRange >( {
		from: startOfDay( subDays( today, 7 ) ),
		to: endOfDay( subDays( today, 1 ) ),
	} );

	const handleChange = ( nextRange: DateRange, nextPrimaryPresetId: PrimaryPresetId ) => {
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

function DateRangePresetsNoSelection() {
	const [ presetId, setPrimaryPresetId ] = useState< PrimaryPresetId | null >( null );
	const [ , setRange ] = useState< DateRange | null >( null );

	const handleChange = ( nextRange: DateRange, nextPrimaryPresetId: PrimaryPresetId ) => {
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

/**
 * No preset selected.
 */
export const NoSelection: Story = {
	render: () => <DateRangePresetsNoSelection />,
};
