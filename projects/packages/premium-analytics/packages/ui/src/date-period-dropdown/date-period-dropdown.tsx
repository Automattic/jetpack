/**
 * External dependencies
 */
import {
	computePrimaryRange,
	getMenuSurfacePresetGroups,
	PRESET_CUSTOM,
	type PrimaryPresetId,
	type QuickSurfacePresetId,
} from '@jetpack-premium-analytics/datetime';
import { Button, Icon } from '@jetpack-premium-analytics/externals';
import { formatDateRange, formatDateRangeNatural } from '@jetpack-premium-analytics/formatters';
import { Dropdown, MenuGroup, MenuItem, NavigableMenu, Tooltip } from '@wordpress/components';
import { useMediaQuery } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';
import { calendar, check, chevronDown } from '@wordpress/icons';
import { useCallback, useMemo, useRef, useState } from 'react';
/**
 * Internal dependencies
 */
import { DateRangePopoverContent, type DateRange } from '../date-range-popover';
import './date-period-dropdown.scss';

/**
 * Viewport width (in pixels) at which the menu can seat two month grids beside
 * its list: the list's own column plus the width two grids need.
 *
 * Read from the viewport rather than a container, since the menu floats in a
 * popover and is bounded by the window rather than by the row it opens from.
 */
const WIDE_MENU_THRESHOLD = 820;

type DatePeriodDropdownProps = {
	/**
	 * The applied preset, or undefined while a custom range drives the period.
	 *
	 * The committed one, never the draft: the calendar stages `custom` from the
	 * first day clicked, and a trigger reading that would rename itself to a
	 * range nothing has applied.
	 */
	appliedPresetId?: PrimaryPresetId;

	/**
	 * The applied range. Names the period on the trigger where no preset does,
	 * and its exact dates are the trigger's tooltip either way.
	 */
	appliedRange: DateRange;

	/**
	 * The periods to offer, filtered against the menu's own order. Defaults to
	 * every selectable preset.
	 */
	presetIds?: readonly QuickSurfacePresetId[];

	/**
	 * Where all time starts, e.g. the resource's publish date. Only read where
	 * the surface offers all time.
	 */
	allTimeStart?: Date;

	/**
	 * IANA timezone string (e.g., 'America/New_York').
	 */
	timeZone: string;

	/**
	 * Fired when a period is picked. Applies on click, with no Apply step.
	 */
	onSelect: ( range: DateRange, presetId: QuickSurfacePresetId ) => void;

	/**
	 * The range the calendar is editing. Held apart from `appliedRange` so the
	 * trigger keeps naming what the widgets are showing while a draft is open.
	 */
	range: DateRange;

	/**
	 * Fired as the calendar's draft changes. Stages, never applies.
	 */
	onChange: ( range?: DateRange, presetId?: PrimaryPresetId ) => void;

	/**
	 * Commits the draft.
	 */
	onApply: () => void;

	/**
	 * Discards the draft. Also fired by every close that is not an Apply.
	 */
	onCancel: () => void;

	/**
	 * Whether the staged range differs from the applied one.
	 */
	canApply: boolean;

	/**
	 * Whether to offer Custom range. On by default; the detail pages' design has
	 * common periods only.
	 */
	withCustomRange?: boolean;

	/** Greys the trigger out but keeps it focusable: a passing state, not a missing control. */
	disabled?: boolean;

	/**
	 * Notifies the parent as the menu opens and closes, so it can mirror the
	 * draft-while-open behaviour for related controls (the comparison label,
	 * which follows the primary range).
	 */
	onOpenChange?: ( isOpen: boolean ) => void;
};

/**
 * The dashboard's period picker: one trigger naming the applied period, and a
 * menu of the common ones grouped by scale.
 */
export function DatePeriodDropdown( {
	appliedPresetId,
	appliedRange,
	presetIds,
	allTimeStart,
	timeZone,
	onSelect,
	range,
	onChange,
	onApply,
	onCancel,
	canApply,
	withCustomRange = true,
	disabled = false,
	onOpenChange,
}: DatePeriodDropdownProps ) {
	// The menu floats free of the row it opens from, so the window is what says
	// whether a second month fits beside the list.
	const isWideScreen = useMediaQuery( `(min-width: ${ WIDE_MENU_THRESHOLD }px)` );
	const groups = useMemo(
		() => getMenuSurfacePresetGroups( timeZone, { presetIds, startDate: allTimeStart } ),
		[ allTimeStart, presetIds, timeZone ]
	);

	/*
	 * Apply and Cancel close the dropdown themselves; every other close (outside
	 * click, Esc, trigger toggle) has to discard the draft the way Cancel does.
	 */
	const closedByActionRef = useRef( false );
	const [ isEditingCustom, setIsEditingCustom ] = useState( false );

	const handleToggle = useCallback(
		( isOpen: boolean ) => {
			if ( ! isOpen && ! closedByActionRef.current ) {
				onCancel();
			}

			closedByActionRef.current = false;
			// Opened on an applied custom range, the menu lands on the calendar:
			// nothing in the list names that range.
			setIsEditingCustom( isOpen && withCustomRange && appliedPresetId === PRESET_CUSTOM );
			onOpenChange?.( isOpen );
		},
		[ appliedPresetId, onCancel, onOpenChange, withCustomRange ]
	);

	/*
	 * Recompute the range at selection time: the memoized preset ranges go stale
	 * while the page stays open, which matters for rolling windows.
	 */
	const selectPreset = useCallback(
		( preset: { id: QuickSurfacePresetId; range: Required< DateRange > } ) => {
			onSelect(
				computePrimaryRange( preset.id, timeZone, { startDate: allTimeStart } ) ?? preset.range,
				preset.id
			);
		},
		[ allTimeStart, onSelect, timeZone ]
	);

	// The preset names the period where one drives it; a hand-picked range is
	// named by the period it covers, and falls back to its own dates.
	const triggerLabel = useMemo( () => {
		const applied = groups.flat().find( preset => preset.id === appliedPresetId );

		return applied?.label ?? formatDateRangeNatural( appliedRange );
	}, [ appliedPresetId, appliedRange, groups ] );

	return (
		<Dropdown
			className="date-period-dropdown"
			popoverProps={ { placement: 'bottom-start' } }
			onToggle={ handleToggle }
			renderToggle={ ( { isOpen, onToggle } ) => (
				// The label names the period, so the dates live here: the design
				// keeps them off the control's face.
				<Tooltip text={ formatDateRange( appliedRange ) }>
					<Button
						className="date-period-dropdown__toggle"
						variant="minimal"
						tone="neutral"
						disabled={ disabled }
						onClick={ onToggle }
						aria-expanded={ isOpen }
						aria-haspopup="true"
					>
						<Icon className="date-period-dropdown__glyph" icon={ calendar } size={ 18 } />
						{ /* Own element so a label too wide for the trigger can ellipsize. */ }
						<span className="date-period-dropdown__label">{ triggerLabel }</span>
						<Icon className="date-period-dropdown__caret" icon={ chevronDown } size={ 18 } />
					</Button>
				</Tooltip>
			) }
			renderContent={ ( { onClose } ) => (
				<div className="date-period-dropdown__panel">
					<NavigableMenu
						className="date-period-dropdown__menu"
						role="menu"
						aria-label={ __( 'Period', 'jetpack-premium-analytics-pkg' ) }
					>
						{ groups.map( group => (
							<MenuGroup key={ group[ 0 ].id }>
								{ group.map( preset => {
									const isSelected = preset.id === appliedPresetId;

									return (
										<MenuItem
											key={ preset.id }
											role="menuitemradio"
											isSelected={ isSelected }
											icon={ isSelected ? check : undefined }
											onClick={ () => {
												closedByActionRef.current = true;
												selectPreset( preset );
												onClose();
											} }
										>
											{ preset.label }
										</MenuItem>
									);
								} ) }
							</MenuGroup>
						) ) }

						{ /* Opens the calendar beside the list rather than closing the menu. */ }
						{ withCustomRange && (
							<MenuGroup>
								<MenuItem
									role="menuitemradio"
									isSelected={ appliedPresetId === PRESET_CUSTOM }
									icon={ appliedPresetId === PRESET_CUSTOM ? check : undefined }
									onClick={ () => setIsEditingCustom( true ) }
								>
									{ __( 'Custom range', 'jetpack-premium-analytics-pkg' ) }
								</MenuItem>
							</MenuGroup>
						) }
					</NavigableMenu>

					{ isEditingCustom && (
						<DateRangePopoverContent
							range={ range }
							onChange={ onChange }
							onApply={ () => {
								closedByActionRef.current = true;
								onApply();
								onClose();
							} }
							onCancel={ () => {
								closedByActionRef.current = true;
								onCancel();
								onClose();
							} }
							canApply={ canApply }
							isWideScreen={ !! isWideScreen }
							timeZone={ timeZone }
						/>
					) }
				</div>
			) }
		/>
	);
}
