/**
 * External dependencies
 */
import { useReportScope } from '@jetpack-premium-analytics/data';
import {
	canStepForward,
	isComparisonPresetId,
	isPrimaryPreset,
	type ComparisonPresetId,
	type IntervalType,
	type PrimaryPresetId,
	type QuickSurfacePresetId,
	type StepDirection,
} from '@jetpack-premium-analytics/datetime';
import { Stack } from '@jetpack-premium-analytics/externals';
import { BaseControl } from '@wordpress/components';
import { useMemo, useCallback, useState } from 'react';
/**
 * Internal dependencies
 */
import { DateComparisonDropdown } from '../date-comparison-dropdown';
import { DateIntervalDropdown } from '../date-interval-dropdown';
import { DatePeriodDropdown } from '../date-period-dropdown';
import { DatePeriodNavigation } from '../date-period-navigation';
import { useComparisonDatePresets } from '../use-comparison-date-presets';

import './date-filters-panel.scss';

type DatePeriodDropdownProps = Parameters< typeof DatePeriodDropdown >[ 0 ];

export type DateRange = DatePeriodDropdownProps[ 'range' ];

export type DateFiltersPanelProps = {
	range: DateRange;

	/**
	 * The applied (committed) preset ID, which names the picker's trigger. The
	 * draft's own preset travels back out through `onChange` and never in: a
	 * control naming it would rename itself to a range nothing has applied.
	 */
	appliedPresetId?: PrimaryPresetId;

	/**
	 * The applied (committed) date range. Used to label the picker's trigger
	 * while the popover is closed. Falls back to `range` when omitted.
	 */
	appliedRange?: DateRange;

	/**
	 * The current comparison preset ID (e.g., 'previous-period', 'previous-month').
	 */
	comparisonPresetId?: ComparisonPresetId;

	/**
	 * The periods the menu offers. Defaults to every selectable preset; a detail
	 * page adds all time (`DETAIL_SURFACE_PRESETS`). The menu keeps its own
	 * order whatever order they arrive in, so its grouping by scale holds.
	 */
	presetIds?: readonly QuickSurfacePresetId[];

	/**
	 * Where all time starts, e.g. the resource's publish date. Only read when
	 * `presetIds` includes it.
	 */
	allTimeStart?: Date;

	/**
	 * Whether to offer Custom range at the end of the menu. On by default; the
	 * detail pages' design has common periods only.
	 */
	withCustomRange?: boolean;

	/**
	 * Whether to render the chart interval control. Off by default: only a
	 * surface whose contents are bucketed by it — one carrying charts rather
	 * than a records table — should offer it.
	 */
	withIntervalControl?: boolean;

	/**
	 * The chart interval the control shows as checked. Resolved against the range
	 * being edited, so an open draft can move it off the applied one.
	 */
	interval?: IntervalType;

	/**
	 * The buckets to list, finest first. Derived upstream from the range and, for
	 * a widget that owns its control, from what its chart draws.
	 */
	intervalOptions?: readonly IntervalType[];

	onChange: DatePeriodDropdownProps[ 'onChange' ];

	onComparisonChange: ( range: DateRange | undefined, presetId?: ComparisonPresetId ) => void;

	onIntervalChange?: ( interval: IntervalType ) => void;

	/**
	 * Steps the applied window backward or forward by its own length. Left out,
	 * the navigation controls are not rendered at all: a surface whose range is
	 * not a movable window has nowhere to step.
	 */
	onStep?: ( direction: StepDirection ) => void;

	/**
	 * Props for the date range popover.
	 */
	rangeControlProps?: Omit< Parameters< typeof BaseControl >[ 0 ], 'children' >;

	/**
	 * Props for the date comparison dropdown. A string `label` renders as the
	 * comparison select's own visible label instead of a BaseControl label.
	 */
	comparisonControlProps?: Omit< Parameters< typeof BaseControl >[ 0 ], 'children' >;

	onApply: DatePeriodDropdownProps[ 'onApply' ];

	onCancel: DatePeriodDropdownProps[ 'onCancel' ];

	canApply?: boolean;

	/**
	 * IANA timezone string (e.g., 'America/New_York', 'Europe/London').
	 * Required for proper date/time handling.
	 */
	timeZone: string;
};

/**
 * Container for the primary date range picker and the comparison dropdown. It
 * owns the comparison state; children only render.
 */
export function DateFiltersPanel( {
	range,
	appliedPresetId,
	appliedRange,
	comparisonPresetId,
	presetIds,
	allTimeStart,
	withCustomRange = true,
	withIntervalControl = false,
	interval,
	intervalOptions,
	onChange,
	onComparisonChange,
	onIntervalChange,
	onStep,
	rangeControlProps = {
		label: null,
		help: null,
	},
	comparisonControlProps = {
		label: null,
		help: null,
	},
	onApply,
	onCancel,
	canApply = true,
	timeZone,
}: DateFiltersPanelProps ) {
	/*
	 * Read rather than a prop, so this and the widgets share one declaration —
	 * a header can never offer a comparison the widgets below aren't fetching.
	 */
	const { offersComparison } = useReportScope();

	// Unknown values (e.g. garbage from the URL) become undefined, which the
	// dropdown reads as the custom preset.
	const validatedAppliedPresetId = useMemo( () => {
		if ( ! appliedPresetId ) {
			return undefined;
		}
		return isPrimaryPreset( appliedPresetId ) ? appliedPresetId : undefined;
	}, [ appliedPresetId ] );

	const validatedComparisonPresetId = useMemo( () => {
		return isComparisonPresetId( comparisonPresetId ) ? comparisonPresetId : undefined;
	}, [ comparisonPresetId ] );

	const comparisonEnabled = !! validatedComparisonPresetId;

	/*
	 * Tracks whether the picker popover is open so the comparison label mirrors
	 * it: previews the draft range while open, reverts to applied when closed
	 * (like the picker's own trigger) — otherwise it'd show a stale draft.
	 */
	const [ isPrimaryPickerOpen, setIsPrimaryPickerOpen ] = useState( false );
	const comparisonSourceRange = isPrimaryPickerOpen ? range : appliedRange ?? range;

	// Available comparison presets, derived from whichever primary range the
	// picker is currently reflecting (draft while open, applied while closed).
	const presets = useComparisonDatePresets( comparisonSourceRange );

	const presetChange = useCallback(
		( id: ComparisonPresetId ) => {
			const nextPreset = presets.find( p => p.id === id );
			onComparisonChange( nextPreset?.range, id );
		},
		[ onComparisonChange, presets ]
	);

	const clearComparison = useCallback( () => {
		onComparisonChange( undefined, undefined );
	}, [ onComparisonChange ] );

	const comparisonLabel =
		typeof comparisonControlProps.label === 'string' ? comparisonControlProps.label : undefined;

	/*
	 * Built once and rendered twice: the row the user sees, and the probe that
	 * measures it. The same element in both places means the measurement cannot
	 * drift from what it measures.
	 */
	const comparisonControl = useMemo(
		() => (
			<DateComparisonDropdown
				presets={ presets }
				enabled={ comparisonEnabled }
				presetId={ validatedComparisonPresetId }
				label={ comparisonLabel }
				onPresetChange={ presetChange }
				onClear={ clearComparison }
			/>
		),
		[
			clearComparison,
			comparisonEnabled,
			comparisonLabel,
			presetChange,
			presets,
			validatedComparisonPresetId,
		]
	);

	/*
	 * Built once, rendered in the row and the probe, like the other controls.
	 * Reads the applied range, not staged: the arrows commit on click, so a
	 * drafted range must not decide whether the forward step is available.
	 */
	const navigationControl = useMemo( () => {
		if ( ! onStep ) {
			return null;
		}

		const committedRange = appliedRange ?? range;

		return (
			<DatePeriodNavigation
				canStepForward={ canStepForward( committedRange, new Date() ) }
				onStep={ onStep }
			/>
		);
	}, [ appliedRange, onStep, range ] );

	// Same arrangement as the comparison control: built once, rendered in the
	// row and in the probe.
	const intervalControl = useMemo(
		() =>
			withIntervalControl && intervalOptions && onIntervalChange ? (
				<DateIntervalDropdown
					options={ intervalOptions }
					value={ interval }
					onChange={ onIntervalChange }
				/>
			) : null,
		[ withIntervalControl, interval, intervalOptions, onIntervalChange ]
	);

	return (
		<div className="date-filters-panel">
			<Stack className="date-filters-panel__row" direction="row" gap="sm">
				{ navigationControl }

				<BaseControl
					className="date-filters-panel__primary"
					label={ rangeControlProps.label }
					id="date-range-popover-button"
					help={ rangeControlProps.help }
				>
					<DatePeriodDropdown
						appliedPresetId={ validatedAppliedPresetId }
						appliedRange={ appliedRange ?? range }
						range={ range }
						onSelect={ ( nextRange, nextPresetId ) => {
							onChange( nextRange, nextPresetId );
							onApply();
						} }
						onChange={ onChange }
						onApply={ onApply }
						onCancel={ onCancel }
						canApply={ canApply }
						timeZone={ timeZone }
						onOpenChange={ setIsPrimaryPickerOpen }
						presetIds={ presetIds }
						allTimeStart={ allTimeStart }
						withCustomRange={ withCustomRange }
					/>
				</BaseControl>

				{ /* Comparison before the interval: it qualifies the range the
				     presets just set, while the interval only buckets the charts. */ }
				{ offersComparison && (
					<BaseControl
						className="date-filters-panel__comparison"
						help={ comparisonControlProps.help }
					>
						{ comparisonControl }
					</BaseControl>
				) }

				{ intervalControl }
			</Stack>
		</div>
	);
}
