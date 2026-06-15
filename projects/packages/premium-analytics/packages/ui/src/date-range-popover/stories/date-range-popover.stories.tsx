import { subDays, startOfDay, endOfDay } from 'date-fns';
import { useState } from 'react';
import { DateRangePopover, DateRangePopoverContent } from '../date-range-filter';
import type { DateRange } from '../date-range-filter';
import type { PrimaryPresetId } from '@jetpack-premium-analytics/datetime';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta< typeof DateRangePopover > = {
	title: 'Packages/Premium Analytics/UI/DateRangePopover',
	component: DateRangePopover,
	tags: [ 'autodocs' ],
	decorators: [
		Story => (
			<div style={ { width: 'max-content' } }>
				<Story />
			</div>
		),
	],
};
export default meta;

type Story = StoryObj< typeof DateRangePopover >;

const today = new Date();
const defaultRange: DateRange = {
	from: startOfDay( subDays( today, 7 ) ),
	to: endOfDay( subDays( today, 1 ) ),
};

// Default timezone for Storybook - avoids dependency on WordPress stores
const STORYBOOK_TIMEZONE = 'America/New_York';

function DateRangePopoverWithState() {
	const [ range, setRange ] = useState< DateRange >( defaultRange );
	const [ presetId, setPrimaryPresetId ] = useState< PrimaryPresetId >( 'last-7-days' );
	const [ pendingRange, setPendingRange ] = useState< DateRange >( defaultRange );
	const [ pendingPrimaryPresetId, setPendingPrimaryPresetId ] =
		useState< PrimaryPresetId >( 'last-7-days' );

	const handleChange = ( nextRange?: DateRange, nextPrimaryPresetId?: PrimaryPresetId ) => {
		if ( nextRange ) {
			setPendingRange( nextRange );
		}
		if ( nextPrimaryPresetId ) {
			setPendingPrimaryPresetId( nextPrimaryPresetId );
		}
	};

	const handleApply = () => {
		setRange( pendingRange );
		setPrimaryPresetId( pendingPrimaryPresetId );
	};

	const handleCancel = () => {
		setPendingRange( range );
		setPendingPrimaryPresetId( presetId );
	};

	const canApply = pendingRange.from !== range.from || pendingRange.to !== range.to;

	return (
		<DateRangePopover
			presetId={ pendingPrimaryPresetId }
			range={ pendingRange }
			onChange={ handleChange }
			onApply={ handleApply }
			onCancel={ handleCancel }
			canApply={ canApply }
			timeZone={ STORYBOOK_TIMEZONE }
		/>
	);
}

export const Default: Story = {
	render: () => <DateRangePopoverWithState />,
};

function DateRangePopoverCustomPreset() {
	const [ range, setRange ] = useState< DateRange >( {
		from: startOfDay( subDays( today, 14 ) ),
		to: endOfDay( subDays( today, 3 ) ),
	} );

	return (
		<DateRangePopover
			presetId="custom"
			range={ range }
			onChange={ nextRange => nextRange && setRange( nextRange ) }
			onApply={ () => {} }
			onCancel={ () => {} }
			canApply={ true }
			timeZone={ STORYBOOK_TIMEZONE }
		/>
	);
}

/**
 * `Custom` preset selected.
 */
export const CustomPreset: Story = {
	render: () => <DateRangePopoverCustomPreset />,
};

function DateRangePopoverTodayPreset() {
	const todayRange: DateRange = {
		from: startOfDay( today ),
		to: endOfDay( today ),
	};
	const [ range, setRange ] = useState< DateRange >( todayRange );

	return (
		<DateRangePopover
			presetId="today"
			range={ range }
			onChange={ nextRange => nextRange && setRange( nextRange ) }
			onApply={ () => {} }
			onCancel={ () => {} }
			canApply={ false }
			timeZone={ STORYBOOK_TIMEZONE }
		/>
	);
}

/**
 * `Today` preset selected.
 */
export const TodayPreset: Story = {
	render: () => <DateRangePopoverTodayPreset />,
};

/**
 * Interactive DateRangePopoverContent with state management.
 */
function PopoverContentWithState( { isWideScreen = false } ) {
	const [ range, setRange ] = useState< DateRange >( defaultRange );
	const [ presetId, setPrimaryPresetId ] = useState< PrimaryPresetId >( 'last-7-days' );

	const handleChange = ( nextRange?: DateRange, nextPrimaryPresetId?: PrimaryPresetId ) => {
		if ( nextRange ) {
			setRange( nextRange );
		}
		if ( nextPrimaryPresetId ) {
			setPrimaryPresetId( nextPrimaryPresetId );
		}
	};

	return (
		<DateRangePopoverContent
			presetId={ presetId }
			range={ range }
			onChange={ handleChange }
			onApply={ () => {} }
			onCancel={ () => {} }
			canApply={ true }
			isWideScreen={ isWideScreen }
			timeZone={ STORYBOOK_TIMEZONE }
		/>
	);
}

/**
 * Interactive DateRangePopoverContent with state management.
 */
export const PopoverContent: Story = {
	render: () => <PopoverContentWithState />,
};

/**
 * Interactive DateRangePopoverContent with state management.
 */
export const PopoverContentWide: Story = {
	render: () => <PopoverContentWithState isWideScreen />,
};
