import { DETAIL_SURFACE_PRESETS, computePrimaryRange } from '@jetpack-premium-analytics/datetime';
import { useState } from 'react';
import { DatePeriodDropdown } from '../date-period-dropdown';
import type { DateRange } from '../../date-range-popover';
import type { PrimaryPresetId, QuickSurfacePresetId } from '@jetpack-premium-analytics/datetime';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta< typeof DatePeriodDropdown > = {
	title: 'Packages/Premium Analytics/UI/DatePeriodDropdown',
	component: DatePeriodDropdown,
	tags: [ 'autodocs' ],
	parameters: {
		docs: {
			description: {
				component:
					'The dashboard period picker: one trigger naming the applied period, a menu of the common ones grouped by scale, and the calendar beside the list once Custom range is chosen.',
			},
		},
	},
	decorators: [
		Story => (
			<div style={ { width: 'max-content' } }>
				<Story />
			</div>
		),
	],
};

export default meta;

type Story = StoryObj< typeof DatePeriodDropdown >;

const TIME_ZONE = 'America/New_York';

// Built in the control's own timezone: the browser's would not be a whole
// calendar month there, which is the point of the story.
const CUSTOM_RANGE: DateRange = computePrimaryRange( 'last-month', TIME_ZONE )!;

function DatePeriodDropdownWithState( {
	initialPresetId = 'last-30-days',
	initialRange,
	presetIds,
	allTimeStart,
}: {
	initialPresetId?: PrimaryPresetId;
	initialRange?: DateRange;
	presetIds?: readonly QuickSurfacePresetId[];
	allTimeStart?: Date;
} ) {
	const [ appliedPresetId, setAppliedPresetId ] = useState< PrimaryPresetId | undefined >(
		initialPresetId
	);
	const [ appliedRange, setAppliedRange ] = useState< DateRange >(
		initialRange ?? computePrimaryRange( 'last-30-days', TIME_ZONE )!
	);
	const [ range, setRange ] = useState< DateRange >( appliedRange );
	// The draft's own preset, held apart the way the dashboard holds it: the
	// calendar stages `custom` on the first click, and nothing is applied yet.
	const [ draftPresetId, setDraftPresetId ] = useState< PrimaryPresetId | undefined >(
		initialPresetId
	);

	return (
		<DatePeriodDropdown
			appliedPresetId={ appliedPresetId }
			appliedRange={ appliedRange }
			range={ range }
			presetIds={ presetIds }
			allTimeStart={ allTimeStart }
			timeZone={ TIME_ZONE }
			canApply={ range !== appliedRange }
			onSelect={ ( nextRange, nextPresetId ) => {
				setAppliedPresetId( nextPresetId );
				setDraftPresetId( nextPresetId );
				setAppliedRange( nextRange );
				setRange( nextRange );
			} }
			onChange={ ( nextRange, nextPresetId ) => {
				if ( nextRange ) {
					setRange( nextRange );
				}
				setDraftPresetId( nextPresetId );
			} }
			onApply={ () => {
				setAppliedPresetId( draftPresetId );
				setAppliedRange( range );
			} }
			onCancel={ () => {
				setDraftPresetId( appliedPresetId );
				setRange( appliedRange );
			} }
		/>
	);
}

export const Default: Story = {
	render: () => <DatePeriodDropdownWithState />,
};

/**
 * A hand-picked range covering a whole month: the trigger names the month, and
 * opening the menu lands on the calendar, which is the only thing that names it.
 */
export const CustomRange: Story = {
	render: () => (
		<DatePeriodDropdownWithState initialPresetId="custom" initialRange={ CUSTOM_RANGE } />
	),
};

/**
 * A resource detail page, which offers all time and only the rolling windows.
 */
export const DetailSurface: Story = {
	render: () => (
		<DatePeriodDropdownWithState
			presetIds={ DETAIL_SURFACE_PRESETS }
			allTimeStart={ new Date( '2024-03-01T00:00:00.000Z' ) }
		/>
	),
};
