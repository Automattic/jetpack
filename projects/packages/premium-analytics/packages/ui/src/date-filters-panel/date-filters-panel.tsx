/**
 * External dependencies
 */
import {
	getQuickSurfacePresets,
	canStepForward,
	isComparisonPresetId,
	isPrimaryPreset,
	type ComparisonPresetId,
	type IntervalType,
	type PrimaryPresetId,
	type StepDirection,
} from '@jetpack-premium-analytics/datetime';
import { Stack } from '@jetpack-premium-analytics/externals';
import { formatDateRangeCompact } from '@jetpack-premium-analytics/formatters';
import { BaseControl } from '@wordpress/components';
import { useResizeObserver } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';
import { useMemo, useCallback, useState, useEffect } from 'react';
/**
 * Internal dependencies
 */
import { DateComparisonDropdown } from '../date-comparison-dropdown';
import { DateIntervalDropdown } from '../date-interval-dropdown';
import { DatePeriodNavigation } from '../date-period-navigation';
import { DateRangeFilter } from '../date-range-filter';
import { resolvePresetLabelMode, WIDE_CALENDAR_CONTAINER_THRESHOLD } from '../date-range-layout';
import {
	getCommittedCustomRange,
	getCustomTriggerLabel,
	getCustomTriggerState,
	type RememberedCustomRange,
} from '../date-range-popover';
import { useComparisonDatePresets } from '../use-comparison-date-presets';
import { PresetRowProbe } from './preset-row-probe';

import './date-filters-panel.scss';

type DateRangeFilterProps = Parameters< typeof DateRangeFilter >[ 0 ];

export type DateRange = DateRangeFilterProps[ 'range' ];

export type DateFiltersPanelProps = {
	/**
	 * The current date range preset ID (e.g., 'last-7-days', 'last-30-days').
	 */
	presetId?: PrimaryPresetId;

	/**
	 * The current primary date range.
	 */
	range: DateRange;

	/**
	 * The applied (committed) preset ID. Used to label the picker's trigger
	 * while the popover is closed, so a discarded draft shows the applied
	 * preset. Falls back to `presetId` when omitted.
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
	 * Whether to render the chart interval control. Off by default: only a
	 * surface whose contents are bucketed by it — one carrying charts rather
	 * than a records table — should offer it.
	 */
	withIntervalControl?: boolean;

	/**
	 * The chart interval every widget on the page draws.
	 */
	interval?: IntervalType;

	/**
	 * The intervals the active range allows, finest first. Derived upstream from
	 * the range, so the menu never offers a bucket the range would coerce away.
	 */
	intervalOptions?: readonly IntervalType[];

	/**
	 * Callback when the primary date range changes.
	 */
	onChange: DateRangeFilterProps[ 'onChange' ];

	/**
	 * Callback when the comparison date range changes.
	 * Receives the calculated comparison range and the preset ID used.
	 */
	onComparisonChange: ( range: DateRange | undefined, presetId?: ComparisonPresetId ) => void;

	/**
	 * Callback when the chart interval changes.
	 */
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

	/**
	 * Callback when the primary date range is applied.
	 */
	onApply: DateRangeFilterProps[ 'onApply' ];

	/**
	 * Callback when the primary date range is canceled.
	 */
	onCancel: DateRangeFilterProps[ 'onCancel' ];

	/**
	 * Whether the primary date range can be applied.
	 */
	canApply?: boolean;

	/**
	 * IANA timezone string (e.g., 'America/New_York', 'Europe/London').
	 * Required for proper date/time handling.
	 */
	timeZone: string;

	/**
	 * Whether to render the period-over-period Compare control. Pages whose
	 * design has no comparison (the post/email detail page) opt out; their
	 * widgets ignore comparison params, and hiding the control keeps the UI
	 * honest about it.
	 */
	showComparison?: boolean;
};

/**
 * DateFiltersPanel - Manages date range selection and comparison controls
 *
 * This component serves as the container for date filtering functionality,
 * managing both the primary date range selection and the comparison date range.
 * It owns the comparison state and delegates to child components for UI.
 */
export function DateFiltersPanel( {
	presetId,
	range,
	appliedPresetId,
	appliedRange,
	comparisonPresetId,
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
	showComparison = true,
}: DateFiltersPanelProps ) {
	/**
	 * Validate and normalize the primary preset ID.
	 * Only accepts built-in preset IDs (including 'custom').
	 * Invalid/unknown values are treated as undefined, which allows
	 * DateRangePopover to handle them gracefully (falls back to custom).
	 */
	const validatedPresetId = useMemo( () => {
		if ( ! presetId ) {
			return undefined;
		}
		// Only accept known built-in presets
		// Unknown/garbage values from URL are rejected to prevent UI inconsistency
		return isPrimaryPreset( presetId ) ? presetId : undefined;
	}, [ presetId ] );

	// Same validation for the applied preset that labels the closed trigger.
	const validatedAppliedPresetId = useMemo( () => {
		if ( ! appliedPresetId ) {
			return undefined;
		}
		return isPrimaryPreset( appliedPresetId ) ? appliedPresetId : undefined;
	}, [ appliedPresetId ] );

	// Validate and normalize the comparison preset ID
	const validatedComparisonPresetId = useMemo( () => {
		return isComparisonPresetId( comparisonPresetId ) ? comparisonPresetId : undefined;
	}, [ comparisonPresetId ] );

	// Derive comparison enabled state directly from validated prop
	const comparisonEnabled = !! validatedComparisonPresetId;

	/*
	 * Track whether the primary picker popover is open so the comparison label
	 * mirrors it: while the picker is open it previews the draft range, but once
	 * closed without Apply it reverts to the applied range (just like the
	 * picker's own trigger). Without this, the comparison label would keep
	 * showing the un-applied draft's derived range.
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

	/**
	 * Handles clearing the comparison completely.
	 * Clears the selected preset and notifies parent.
	 */
	const clearComparison = useCallback( () => {
		onComparisonChange( undefined, undefined );
	}, [ onComparisonChange ] );

	/*
	 * Single source of truth for the responsive layout: measure the container
	 * once here and derive both `labelMode` and `isWideScreen`. Children never
	 * measure; both are forwarded to the ones that need them.
	 */
	const [ containerWidth, setContainerWidth ] = useState< number | null >( null );
	const [ rootElement, setRootElement ] = useState< HTMLElement | null >( null );

	const handleResize = useCallback( ( entries: ResizeObserverEntry[] ) => {
		const entry = entries[ 0 ];
		if ( entry ) {
			// Floored rather than rounded, to stay on the conservative side of the
			// probe's `Math.ceil`. Both consumers are step functions, so a raw float
			// would only re-render on every frame of a drag.
			setContainerWidth( Math.floor( entry.contentRect.width ) );
		}
	}, [] );

	const setObserverRef = useResizeObserver< HTMLElement >( handleResize );

	// This panel's own root, falling back to the body only until the ref lands.
	useEffect( () => {
		setObserverRef( rootElement ?? document.body );
	}, [ rootElement, setObserverRef ] );

	/*
	 * The last applied custom range, so the trigger can offer the way back to it
	 * while a preset drives the range.
	 *
	 * Owned here rather than in the popover because the probe has to reproduce
	 * the trigger's label exactly; held downstream it would measure "Custom"
	 * against a trigger showing a formatted range. Only ever set: a preset
	 * selection clears the committed custom range, which is the thing worth
	 * surviving.
	 */
	const [ rememberedCustomRange, setRememberedCustomRange ] =
		useState< RememberedCustomRange | null >( null );

	useEffect( () => {
		const committedCustomRange = getCommittedCustomRange( validatedAppliedPresetId, appliedRange );

		if ( committedCustomRange ) {
			setRememberedCustomRange( committedCustomRange );
		}
	}, [ validatedAppliedPresetId, appliedRange ] );

	// Derived through the same helpers the trigger uses, so the probe measures
	// the string the trigger is actually showing.
	const customTriggerLabel = useMemo( () => {
		const committedRange = appliedRange ?? range;

		return getCustomTriggerLabel( {
			triggerState: getCustomTriggerState( {
				presetId: validatedPresetId,
				appliedPresetId: validatedAppliedPresetId,
				canApply,
				isOpen: isPrimaryPickerOpen,
			} ),
			range,
			committedRange,
			rememberedCustomRange,
			customLabel: __( 'Custom', 'jetpack-premium-analytics-pkg' ),
			formatRange: formatDateRangeCompact,
		} );
	}, [
		appliedRange,
		canApply,
		isPrimaryPickerOpen,
		range,
		rememberedCustomRange,
		validatedAppliedPresetId,
		validatedPresetId,
	] );

	// Labels only. The pills recompute their own ranges at selection time, so a
	// stale memo here costs nothing.
	const surfacePresets = useMemo( () => getQuickSurfacePresets( timeZone ), [ timeZone ] );

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
	 * Same arrangement as the other two: built once, rendered in the row and in
	 * the probe.
	 *
	 * Read from the applied range, not the staged one. The arrows sit outside
	 * the picker and commit on click, so a range being drafted must not decide
	 * whether the forward one is there.
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

	const [ fullRowWidth, setFullRowWidth ] = useState< number | null >( null );
	const handleProbeMeasure = useCallback( ( width: number ) => {
		setFullRowWidth( width );
	}, [] );

	// Measured, so the boundary follows the active locale rather than a
	// breakpoint picked for English, and moves with the comparison control:
	// adding one takes room the presets give back.
	const labelMode = useMemo(
		() => resolvePresetLabelMode( containerWidth, fullRowWidth ),
		[ containerWidth, fullRowWidth ]
	);

	const isWideScreen =
		containerWidth !== null && containerWidth >= WIDE_CALENDAR_CONTAINER_THRESHOLD;

	return (
		<Stack ref={ setRootElement } className="date-filters-panel" direction="row" gap="sm">
			<PresetRowProbe
				presets={ surfacePresets }
				customTriggerLabel={ customTriggerLabel }
				navigation={ navigationControl }
				interval={ intervalControl }
				comparison={ comparisonControl }
				onMeasure={ handleProbeMeasure }
			/>

			{ navigationControl }

			<BaseControl
				className="date-filters-panel__primary"
				label={ rangeControlProps.label }
				id="date-range-popover-button"
				help={ rangeControlProps.help }
			>
				<DateRangeFilter
					presetId={ validatedPresetId }
					range={ range }
					appliedPresetId={ validatedAppliedPresetId }
					appliedRange={ appliedRange }
					onChange={ onChange }
					onApply={ onApply }
					onCancel={ onCancel }
					canApply={ canApply }
					timeZone={ timeZone }
					labelMode={ labelMode }
					isWideScreen={ isWideScreen }
					rememberedCustomRange={ rememberedCustomRange }
					onOpenChange={ setIsPrimaryPickerOpen }
				/>
			</BaseControl>

			{ intervalControl }

			{ showComparison && (
				<BaseControl
					className="date-filters-panel__comparison"
					help={ comparisonControlProps.help }
				>
					{ comparisonControl }
				</BaseControl>
			) }
		</Stack>
	);
}
