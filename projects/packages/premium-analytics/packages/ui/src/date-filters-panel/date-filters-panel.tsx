/**
 * External dependencies
 */
import {
	getQuickSurfacePresets,
	isComparisonPresetId,
	isPrimaryPreset,
	type ComparisonPresetId,
	type PrimaryPresetId,
} from '@jetpack-premium-analytics/datetime';
import { Stack } from '@jetpack-premium-analytics/externals';
import { formatDateRange } from '@jetpack-premium-analytics/formatters';
import { BaseControl } from '@wordpress/components';
import { useResizeObserver } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
import { useMemo, useCallback, useState, useEffect } from 'react';
/**
 * Internal dependencies
 */
import { DateComparisonDropdown } from '../date-comparison-dropdown';
import { DateRangeFilter } from '../date-range-filter';
import {
	resolvePresetLabelMode,
	WIDE_CALENDAR_CONTAINER_THRESHOLD,
	type PresetRowWidths,
} from '../date-range-layout';
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
	 * Callback when the primary date range changes.
	 */
	onChange: DateRangeFilterProps[ 'onChange' ];

	/**
	 * Callback when the comparison date range changes.
	 * Receives the calculated comparison range and the preset ID used.
	 */
	onComparisonChange: ( range: DateRange | undefined, presetId?: ComparisonPresetId ) => void;

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
	onChange,
	onComparisonChange,
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
	 * once here and derive both `isCompact` and `isWideScreen`. Children never
	 * measure — the compact styling cascades from the `is-compact` root class,
	 * and `isWideScreen` is forwarded only because the calendar needs it.
	 */
	const [ containerWidth, setContainerWidth ] = useState< number | null >( null );
	const [ rootElement, setRootElement ] = useState< HTMLElement | null >( null );

	const handleResize = useCallback( ( entries: ResizeObserverEntry[] ) => {
		const entry = entries[ 0 ];
		if ( entry ) {
			// Floored, and floored rather than rounded to stay on the conservative
			// side of the probe's `Math.ceil`. Both consumers are step functions, so
			// the fractional part never changes the output while a raw float would
			// re-render the panel on every frame of a drag.
			setContainerWidth( Math.floor( entry.contentRect.width ) );
		}
	}, [] );

	const setObserverRef = useResizeObserver< HTMLElement >( handleResize );

	/*
	 * Measure this panel's own root. Callers used to wrap the panel and hand the
	 * wrapper back as a prop; all ten passed their immediate wrapper, so the
	 * number was the panel's own width and the ceremony bought nothing.
	 */
	useEffect( () => {
		setObserverRef( rootElement ?? document.body );
	}, [ rootElement, setObserverRef ] );

	/*
	 * The last applied custom range, remembered so the trigger can offer the way
	 * back to it while a preset is driving the range.
	 *
	 * Owned here rather than inside the popover because it is an input to the
	 * trigger's label, and the probe below has to reproduce that label exactly.
	 * Held downstream it would be invisible to the probe, which would measure
	 * "Custom" against a trigger showing a formatted range and under-measure the
	 * row by the difference between the two.
	 *
	 * Only ever set: a preset selection clears the committed custom range, and
	 * the point of remembering is to survive exactly that.
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
			formatRange: formatDateRange,
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

	const [ rowWidths, setRowWidths ] = useState< PresetRowWidths | null >( null );
	const handleProbeMeasure = useCallback( ( widths: PresetRowWidths ) => {
		setRowWidths( widths );
	}, [] );

	// Both candidates come from the probe, so the boundary follows the active
	// locale rather than a breakpoint picked for English.
	const labelMode = useMemo(
		() => resolvePresetLabelMode( containerWidth, rowWidths ),
		[ containerWidth, rowWidths ]
	);

	const isCompact = labelMode === 'select';
	const isWideScreen =
		containerWidth !== null && containerWidth >= WIDE_CALENDAR_CONTAINER_THRESHOLD;

	return (
		<Stack
			ref={ setRootElement }
			className={ clsx( 'date-filters-panel', { 'is-compact': isCompact } ) }
			direction={ isCompact ? 'column' : 'row' }
			wrap={ isCompact ? 'nowrap' : 'wrap' }
			gap="sm"
		>
			<PresetRowProbe
				presets={ surfacePresets }
				customTriggerLabel={ customTriggerLabel }
				onMeasure={ handleProbeMeasure }
			/>

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

			<BaseControl className="date-filters-panel__comparison" help={ comparisonControlProps.help }>
				<DateComparisonDropdown
					presets={ presets }
					enabled={ comparisonEnabled }
					presetId={ validatedComparisonPresetId }
					label={
						typeof comparisonControlProps.label === 'string'
							? comparisonControlProps.label
							: undefined
					}
					onPresetChange={ presetChange }
					onClear={ clearComparison }
				/>
			</BaseControl>
		</Stack>
	);
}
