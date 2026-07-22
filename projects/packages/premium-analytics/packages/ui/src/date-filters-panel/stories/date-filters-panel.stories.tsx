import {
	computePrimaryRange,
	type ComparisonPresetId,
	type PrimaryPresetId,
} from '@jetpack-premium-analytics/datetime';
import { endOfDay, subDays, startOfDay } from 'date-fns';
import { useCallback, useRef, useState } from 'react';
import { DateFiltersPanel } from '../date-filters-panel';
import type { DateRange } from '../date-filters-panel';
import type { Meta, StoryObj } from '@storybook/react';

const STORYBOOK_TIMEZONE = 'America/New_York';

const meta: Meta< typeof DateFiltersPanel > = {
	title: 'Packages/Premium Analytics/UI/DateFiltersPanel',
	component: DateFiltersPanel,
	tags: [ 'autodocs' ],
	parameters: {
		docs: {
			description: {
				component:
					'Dashboard date filters: primary date range (surface presets + custom calendar) ' +
					'and optional comparison range.',
			},
		},
	},
};
export default meta;

type Story = StoryObj< typeof DateFiltersPanel >;

type PrimaryFilterState = {
	range: DateRange;
	presetId: PrimaryPresetId;
};

function buildPrimaryState( presetId: PrimaryPresetId = 'last-30-days' ): PrimaryFilterState {
	if ( presetId === 'custom' ) {
		const today = new Date();

		return {
			presetId,
			range: {
				from: startOfDay( subDays( today, 14 ) ),
				to: endOfDay( subDays( today, 3 ) ),
			},
		};
	}

	const range = computePrimaryRange( presetId, STORYBOOK_TIMEZONE );

	if ( range?.from && range.to ) {
		return {
			presetId,
			range: { from: range.from, to: range.to },
		};
	}

	const today = new Date();

	return {
		presetId,
		range: {
			from: startOfDay( subDays( today, 7 ) ),
			to: endOfDay( subDays( today, 1 ) ),
		},
	};
}

type DateFiltersPanelStoryProps = {
	initialPreset?: PrimaryPresetId;
	withComparison?: boolean;
	initialComparisonPreset?: ComparisonPresetId;
	containerWidth?: string | number;
};

/**
 * Mirrors the dashboard wiring: staged primary edits, committed on Apply (or
 * immediately for quick presets), and comparison enabled via preset ID.
 */
function DateFiltersPanelStory( {
	initialPreset = 'last-7-days',
	withComparison = true,
	initialComparisonPreset = 'previous-period',
	containerWidth = '100%',
}: DateFiltersPanelStoryProps ) {
	const initialPrimary = buildPrimaryState( initialPreset );

	const [ committedPrimary, setCommittedPrimary ] = useState( initialPrimary );
	const [ stagedPrimary, setStagedPrimary ] = useState( initialPrimary );
	const stagedPrimaryRef = useRef( stagedPrimary );
	stagedPrimaryRef.current = stagedPrimary;

	const [ comparisonPresetId, setComparisonPresetId ] = useState< ComparisonPresetId | undefined >(
		withComparison ? initialComparisonPreset : undefined
	);

	const [ containerElement, setContainerElement ] = useState< HTMLDivElement | null >( null );

	const handlePrimaryChange = useCallback(
		( nextRange?: DateRange, nextPresetId?: PrimaryPresetId ) => {
			const nextPrimary: PrimaryFilterState = {
				range: nextRange ?? stagedPrimaryRef.current.range,
				presetId: nextPresetId ?? stagedPrimaryRef.current.presetId,
			};

			stagedPrimaryRef.current = nextPrimary;
			setStagedPrimary( nextPrimary );
		},
		[]
	);

	const handlePrimaryApply = useCallback( () => {
		setCommittedPrimary( stagedPrimaryRef.current );
	}, [] );

	const handlePrimaryCancel = useCallback( () => {
		stagedPrimaryRef.current = committedPrimary;
		setStagedPrimary( committedPrimary );
	}, [ committedPrimary ] );

	const handleComparisonChange = useCallback(
		(
			_nextComparisonRange: DateRange | undefined,
			nextComparisonPresetId?: ComparisonPresetId
		) => {
			setComparisonPresetId( nextComparisonPresetId );

			const hasPrimaryDraft =
				stagedPrimaryRef.current.range.from !== committedPrimary.range.from ||
				stagedPrimaryRef.current.range.to !== committedPrimary.range.to ||
				stagedPrimaryRef.current.presetId !== committedPrimary.presetId;

			if ( ! hasPrimaryDraft && nextComparisonPresetId ) {
				// Comparison commits immediately when the primary range is not mid-edit.
				setCommittedPrimary( stagedPrimaryRef.current );
			}
		},
		[ committedPrimary ]
	);

	const canApplyPrimary =
		stagedPrimary.range.from !== committedPrimary.range.from ||
		stagedPrimary.range.to !== committedPrimary.range.to ||
		stagedPrimary.presetId !== committedPrimary.presetId;

	return (
		<div
			ref={ setContainerElement }
			style={ {
				width: containerWidth,
				maxWidth: '960px',
			} }
		>
			<DateFiltersPanel
				presetId={ stagedPrimary.presetId }
				range={ stagedPrimary.range }
				appliedPresetId={ committedPrimary.presetId }
				appliedRange={ committedPrimary.range }
				comparisonPresetId={ comparisonPresetId }
				onChange={ handlePrimaryChange }
				onComparisonChange={ handleComparisonChange }
				onApply={ handlePrimaryApply }
				onCancel={ handlePrimaryCancel }
				canApply={ canApplyPrimary }
				timeZone={ STORYBOOK_TIMEZONE }
				containerElement={ containerElement }
			/>
		</div>
	);
}

/**
 * Default dashboard filters row: Last 30 days with comparison to the previous period.
 */
export const DashboardFilters: Story = {
	render: () => <DateFiltersPanelStory />,
};

/**
 * Primary range only — comparison disabled until a preset is picked from the
 * comparison select.
 */
export const WithoutComparison: Story = {
	render: () => <DateFiltersPanelStory withComparison={ false } />,
};

/**
 * Custom primary range with comparison to the previous period.
 */
export const CustomRangeWithComparison: Story = {
	render: () => (
		<DateFiltersPanelStory initialPreset="custom" initialComparisonPreset="previous-period" />
	),
};

/**
 * Narrow container — quick presets collapse to the compact select, like mobile layouts.
 */
export const CompactLayout: Story = {
	render: () => <DateFiltersPanelStory containerWidth={ 360 } />,
};
