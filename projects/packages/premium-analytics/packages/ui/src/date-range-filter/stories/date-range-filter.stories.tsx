import { subDays, startOfDay, endOfDay } from 'date-fns';
import { useRef, useState } from 'react';
import { DateRangeFilter } from '../date-range-filter';
import type { DateRange } from '../../date-range-popover';
import type { PrimaryPresetId } from '@jetpack-premium-analytics/datetime';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta< typeof DateRangeFilter > = {
	title: 'Packages/Premium Analytics/UI/DateRangeFilter',
	component: DateRangeFilter,
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

type Story = StoryObj< typeof DateRangeFilter >;

const today = new Date();
const defaultRange: DateRange = {
	from: startOfDay( subDays( today, 7 ) ),
	to: endOfDay( subDays( today, 1 ) ),
};

const STORYBOOK_TIMEZONE = 'America/New_York';

type FilterState = {
	range: DateRange;
	presetId: PrimaryPresetId;
};

function DateRangeFilterWithState( { initialPreset = 'last-7-days' as PrimaryPresetId } ) {
	const customRange: DateRange = {
		from: startOfDay( subDays( today, 14 ) ),
		to: endOfDay( subDays( today, 3 ) ),
	};
	const initialRange = initialPreset === 'custom' ? customRange : defaultRange;
	const initialState: FilterState = {
		range: initialRange,
		presetId: initialPreset,
	};

	const [ committed, setCommitted ] = useState< FilterState >( initialState );
	const [ staged, setStaged ] = useState< FilterState >( initialState );
	const stagedRef = useRef( staged );
	stagedRef.current = staged;

	const handleChange = ( nextRange?: DateRange, nextPresetId?: PrimaryPresetId ) => {
		const nextState: FilterState = {
			range: nextRange ?? stagedRef.current.range,
			presetId: nextPresetId ?? stagedRef.current.presetId,
		};

		stagedRef.current = nextState;
		setStaged( nextState );
	};

	const handleApply = () => {
		setCommitted( stagedRef.current );
	};

	const handleCancel = () => {
		stagedRef.current = committed;
		setStaged( committed );
	};

	const canApply =
		staged.range.from !== committed.range.from ||
		staged.range.to !== committed.range.to ||
		staged.presetId !== committed.presetId;

	return (
		<DateRangeFilter
			presetId={ staged.presetId }
			range={ staged.range }
			appliedPresetId={ committed.presetId }
			appliedRange={ committed.range }
			onChange={ handleChange }
			onApply={ handleApply }
			onCancel={ handleCancel }
			canApply={ canApply }
			timeZone={ STORYBOOK_TIMEZONE }
		/>
	);
}

export const Default: Story = {
	render: () => <DateRangeFilterWithState />,
};

export const CustomRange: Story = {
	render: () => <DateRangeFilterWithState initialPreset="custom" />,
};

export const Compact: Story = {
	render: () => (
		<div style={ { width: '360px' } }>
			<DateRangeFilterWithState />
		</div>
	),
};
