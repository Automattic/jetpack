import { computePrimaryRange, type PrimaryPresetId } from '@jetpack-premium-analytics/datetime';
import { subDays, startOfDay, endOfDay } from 'date-fns';
import { useRef, useState } from 'react';
import { DateRangeFilter } from '../date-range-filter';
import type { PresetLabelMode } from '../../date-range-layout';
import type { DateRange } from '../../date-range-popover';
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

const STORYBOOK_TIMEZONE = 'America/New_York';

type FilterState = {
	range: DateRange;
	presetId: PrimaryPresetId;
};

function buildInitialState( initialPreset: PrimaryPresetId ): FilterState {
	if ( initialPreset === 'custom' ) {
		return {
			presetId: initialPreset,
			range: {
				from: startOfDay( subDays( new Date(), 14 ) ),
				to: endOfDay( subDays( new Date(), 3 ) ),
			},
		};
	}

	const range = computePrimaryRange( initialPreset, STORYBOOK_TIMEZONE );

	return {
		presetId: initialPreset,
		range:
			range?.from && range.to
				? { from: range.from, to: range.to }
				: {
						from: startOfDay( subDays( new Date(), 30 ) ),
						to: endOfDay( subDays( new Date(), 1 ) ),
				  },
	};
}

function DateRangeFilterWithState( {
	initialPreset = 'last-30-days' as PrimaryPresetId,
	labelMode = 'full' as PresetLabelMode,
	isWideScreen = false,
}: {
	initialPreset?: PrimaryPresetId;
	labelMode?: PresetLabelMode;
	isWideScreen?: boolean;
} ) {
	const initialState = buildInitialState( initialPreset );

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
			labelMode={ labelMode }
			isWideScreen={ isWideScreen }
		/>
	);
}

export const Default: Story = {
	render: () => <DateRangeFilterWithState />,
};

export const CustomRange: Story = {
	render: () => <DateRangeFilterWithState initialPreset="custom" />,
};

/*
 * Compact renders the presets as a select and the custom trigger as a bordered
 * button. The panel-level framing (gap, full-width row) cascades from
 * `.date-filters-panel.is-compact` and is shown in the DateFiltersPanel story;
 * here we only demo the control switch.
 */
export const Compact: Story = {
	render: () => (
		<div style={ { width: '360px' } }>
			<DateRangeFilterWithState labelMode="select" />
		</div>
	),
};
