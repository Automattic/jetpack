import { DETAIL_SURFACE_PRESETS, computePrimaryRange } from '@jetpack-premium-analytics/datetime';
import { startOfMonth, endOfMonth, subMonths } from 'date-fns';
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

const lastMonth = subMonths( new Date(), 1 );
const CUSTOM_RANGE: DateRange = {
	from: startOfMonth( lastMonth ),
	to: endOfMonth( lastMonth ),
};

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
	const [ presetId, setPresetId ] = useState< PrimaryPresetId | undefined >( initialPresetId );
	const [ appliedRange, setAppliedRange ] = useState< DateRange >(
		initialRange ?? computePrimaryRange( 'last-30-days', TIME_ZONE )!
	);
	const [ range, setRange ] = useState< DateRange >( appliedRange );

	return (
		<DatePeriodDropdown
			presetId={ presetId }
			appliedRange={ appliedRange }
			range={ range }
			presetIds={ presetIds }
			allTimeStart={ allTimeStart }
			timeZone={ TIME_ZONE }
			canApply={ range !== appliedRange }
			onSelect={ ( nextRange, nextPresetId ) => {
				setPresetId( nextPresetId );
				setAppliedRange( nextRange );
				setRange( nextRange );
			} }
			onChange={ ( nextRange, nextPresetId ) => {
				if ( nextRange ) {
					setRange( nextRange );
				}
				setPresetId( nextPresetId );
			} }
			onApply={ () => setAppliedRange( range ) }
			onCancel={ () => setRange( appliedRange ) }
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
