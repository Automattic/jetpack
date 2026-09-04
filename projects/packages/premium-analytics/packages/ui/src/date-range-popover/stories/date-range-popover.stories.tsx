import { subDays, startOfDay, endOfDay } from 'date-fns';
import { useState } from 'react';
import { DateRangePopoverContent } from '../date-range-filter';
import type { DateRange } from '../date-range-filter';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta< typeof DateRangePopoverContent > = {
	title: 'Packages/Premium Analytics/UI/DateRangePopoverContent',
	component: DateRangePopoverContent,
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

type Story = StoryObj< typeof DateRangePopoverContent >;

const today = new Date();
const defaultRange: DateRange = {
	from: startOfDay( subDays( today, 7 ) ),
	to: endOfDay( subDays( today, 1 ) ),
};

// Default timezone for Storybook - avoids dependency on WordPress stores
const STORYBOOK_TIMEZONE = 'America/New_York';

function PopoverContentWithState( { isWideScreen = false } ) {
	const [ range, setRange ] = useState< DateRange >( defaultRange );

	const handleChange = ( nextRange?: DateRange ) => {
		if ( nextRange ) {
			setRange( nextRange );
		}
	};

	return (
		<DateRangePopoverContent
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
 * The popover content in the wide layout: two calendar months instead of one.
 */
export const PopoverContentWide: Story = {
	render: () => <PopoverContentWithState isWideScreen />,
};
