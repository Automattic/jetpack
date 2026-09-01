/**
 * External dependencies
 */
import { useReportScope } from '@jetpack-premium-analytics/data';
import {
	getQuickSurfacePresets,
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
import { formatDateRangeMinimal } from '@jetpack-premium-analytics/formatters';
import { BaseControl } from '@wordpress/components';
import { useResizeObserver } from '@wordpress/compose';
import { flushSync } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useMemo, useCallback, useState, useEffect, type CSSProperties } from 'react';
/**
 * Internal dependencies
 */
import { DateComparisonDropdown } from '../date-comparison-dropdown';
import { DateIntervalDropdown } from '../date-interval-dropdown';
import { DatePeriodNavigation } from '../date-period-navigation';
import { DateRangeFilter } from '../date-range-filter';
import { resolvePresetLabelMode, WIDE_CALENDAR_CONTAINER_THRESHOLD } from '../date-range-layout';
import { getCustomTriggerLabel, getCustomTriggerState } from '../date-range-popover';
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
	 * The presets rendered as pills, in display order. Defaults to the rolling
	 * windows; a detail page leads with all time (`DETAIL_SURFACE_PRESETS`).
	 */
	presetIds?: readonly QuickSurfacePresetId[];

	/**
	 * Where the all-time pill starts, e.g. the resource's publish date. Only
	 * read when `presetIds` includes all time.
	 */
	allTimeStart?: Date;

	/**
	 * Whether to offer the custom-range popover after the pills. On by default;
	 * the detail pages' design has presets only.
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

	onChange: DateRangeFilterProps[ 'onChange' ];

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

	onApply: DateRangeFilterProps[ 'onApply' ];

	onCancel: DateRangeFilterProps[ 'onCancel' ];

	canApply?: boolean;

	/**
	 * IANA timezone string (e.g., 'America/New_York', 'Europe/London').
	 * Required for proper date/time handling.
	 */
	timeZone: string;

	/**
	 * Element to measure for the responsive layout instead of the panel's own
	 * root. Required in a shrink-to-fit slot (e.g. a shared header row), where
	 * the root's width follows the panel's own content and can't self-measure.
	 */
	containerElement?: HTMLElement | null;

	/**
	 * Inline space in the measured container never available to the panel —
	 * e.g. a title's minimum share on a shared header row. Subtracted before
	 * resolving layout, so the panel steps down before the row-mates lose theirs.
	 */
	reservedInlineSize?: number;
};

/**
 * Container for the primary date range picker and the comparison dropdown. It
 * owns the comparison state and the responsive measurement; children only
 * render.
 */
export function DateFiltersPanel( {
	presetId,
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
	containerElement,
	reservedInlineSize = 0,
}: DateFiltersPanelProps ) {
	/*
	 * Read rather than a prop, so this and the widgets share one declaration —
	 * a header can never offer a comparison the widgets below aren't fetching.
	 */
	const { offersComparison } = useReportScope();

	// Unknown values (e.g. garbage from the URL) become undefined, which
	// DateRangePopover reads as the custom preset.
	const validatedPresetId = useMemo( () => {
		if ( ! presetId ) {
			return undefined;
		}
		return isPrimaryPreset( presetId ) ? presetId : undefined;
	}, [ presetId ] );

	// Same validation for the applied preset that labels the closed trigger.
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
			// Flushed synchronously: ResizeObserver fires between layout and paint,
			// so this keeps the resize and its label form in the same frame.
			// Ceiled so a slot sized by the published width compares equal.
			flushSync( () => {
				setContainerWidth( Math.ceil( entry.contentRect.width ) );
			} );
		}
	}, [] );

	const setObserverRef = useResizeObserver< HTMLElement >( handleResize );

	/*
	 * Measures the caller's container when given one, else the panel's own root
	 * (body until the ref lands). The setter also detaches: `useResizeObserver`
	 * unobserves only when called with `null`.
	 */
	useEffect( () => {
		setObserverRef( containerElement ?? rootElement ?? document.body );

		return () => setObserverRef( null );
	}, [ containerElement, rootElement, setObserverRef ] );

	// Derived through the same helpers the trigger uses, so the probe measures
	// the string the trigger is actually showing — or nothing, on a surface
	// that offers no custom range.
	const customTriggerLabel = useMemo( () => {
		if ( ! withCustomRange ) {
			return undefined;
		}

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
			customLabel: __( 'Custom', 'jetpack-premium-analytics-pkg' ),
			formatRange: formatDateRangeMinimal,
		} );
	}, [
		appliedRange,
		canApply,
		isPrimaryPickerOpen,
		range,
		validatedAppliedPresetId,
		validatedPresetId,
		withCustomRange,
	] );

	// Labels only. The pills recompute their own ranges at selection time, so a
	// stale memo here costs nothing.
	const surfacePresets = useMemo(
		() => getQuickSurfacePresets( timeZone, { presetIds } ),
		[ presetIds, timeZone ]
	);

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

	const [ fullRowWidth, setFullRowWidth ] = useState< number | null >( null );
	const handleProbeMeasure = useCallback( ( width: number ) => {
		setFullRowWidth( width );
	}, [] );

	// Measured, so the boundary follows the active locale, not an English
	// breakpoint, and shifts as the comparison control is added or removed.
	// The reserved share is subtracted first, so row-mates keep their minimum.
	const labelMode = useMemo(
		() =>
			resolvePresetLabelMode(
				containerWidth === null ? null : containerWidth - reservedInlineSize,
				fullRowWidth
			),
		[ containerWidth, fullRowWidth, reservedInlineSize ]
	);

	const isWideScreen =
		containerWidth !== null && containerWidth >= WIDE_CALENDAR_CONTAINER_THRESHOLD;

	// Published so a host can size the panel's slot from the full-labels width.
	const rootStyle = useMemo(
		() =>
			fullRowWidth === null
				? undefined
				: ( {
						'--date-filters-panel-full-row-width': `${ fullRowWidth }px`,
				  } as CSSProperties ),
		[ fullRowWidth ]
	);

	return (
		<div ref={ setRootElement } className="date-filters-panel" style={ rootStyle }>
			<PresetRowProbe
				presets={ surfacePresets }
				customTriggerLabel={ customTriggerLabel }
				navigation={ navigationControl }
				comparison={ comparisonControl }
				interval={ intervalControl }
				onMeasure={ handleProbeMeasure }
			/>

			<Stack className="date-filters-panel__row" direction="row" gap="sm">
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
