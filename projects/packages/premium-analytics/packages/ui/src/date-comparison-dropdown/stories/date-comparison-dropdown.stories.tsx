import { subDays, startOfDay, endOfDay } from 'date-fns';
import { useState } from 'react';
import { useComparisonDatePresets } from '../../use-comparison-date-presets';
import { DateComparisonDropdown } from '../date-comparison-dropdown';
import type { DateRange } from '../../date-range-popover';
import type { ComparisonPresetId } from '@jetpack-premium-analytics/datetime';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta< typeof DateComparisonDropdown > = {
	title: 'Packages/Premium Analytics/UI/DateComparisonDropdown',
	component: DateComparisonDropdown,
	tags: [ 'autodocs' ],
	parameters: {
		docs: {
			description: {
				component: 'Comparison period select with a dynamic trigger label and preset options.',
			},
		},
	},
};

export default meta;

type Story = StoryObj< typeof DateComparisonDropdown >;

const today = new Date();
const defaultRange: DateRange = {
	from: startOfDay( subDays( today, 30 ) ),
	to: endOfDay( subDays( today, 1 ) ),
};

function DateComparisonDropdownWithState( {
	initialEnabled = true,
	initialPresetId = 'previous-period',
	removeCompareToPrefix = false,
}: {
	initialEnabled?: boolean;
	initialPresetId?: ComparisonPresetId;
	removeCompareToPrefix?: boolean;
} ) {
	const [ enabled, setEnabled ] = useState( initialEnabled );
	const [ presetId, setPresetId ] = useState< ComparisonPresetId | undefined >(
		initialEnabled ? initialPresetId : undefined
	);

	const presets = useComparisonDatePresets( defaultRange );

	return (
		<DateComparisonDropdown
			presets={ presets }
			enabled={ enabled }
			presetId={ presetId }
			removeCompareToPrefix={ removeCompareToPrefix }
			onPresetChange={ id => {
				setEnabled( true );
				setPresetId( id );
			} }
			onClear={ () => {
				setEnabled( false );
				setPresetId( undefined );
			} }
		/>
	);
}

/**
 * Default state with comparison enabled and "Previous period" selected.
 */
export const Default: Story = {
	render: () => <DateComparisonDropdownWithState />,
};

/**
 * Comparison disabled — select shows "No comparison".
 */
export const Disabled: Story = {
	render: () => <DateComparisonDropdownWithState initialEnabled={ false } />,
};

/**
 * With "Previous month" preset selected.
 */
export const PreviousMonthSelected: Story = {
	render: () => <DateComparisonDropdownWithState initialPresetId="previous-month" />,
};

/**
 * With an external BaseControl label instead of the built-in select label.
 */
export const WithExternalLabel: Story = {
	render: () => <DateComparisonDropdownWithState removeCompareToPrefix />,
};
