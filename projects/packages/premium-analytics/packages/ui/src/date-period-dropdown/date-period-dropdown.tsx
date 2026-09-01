/**
 * External dependencies
 */
import {
	computePrimaryRange,
	getMenuSurfacePresetGroups,
	type PrimaryPresetId,
	type QuickSurfacePresetId,
} from '@jetpack-premium-analytics/datetime';
import { Button, Icon } from '@jetpack-premium-analytics/externals';
import { formatDateRange, formatDateRangeNatural } from '@jetpack-premium-analytics/formatters';
import { Dropdown, MenuGroup, MenuItem, NavigableMenu, Tooltip } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { calendar, check, chevronDown } from '@wordpress/icons';
import { useCallback, useMemo } from 'react';
/**
 * Internal dependencies
 */
import type { DateRange } from '../date-range-popover';
import './date-period-dropdown.scss';

type DatePeriodDropdownProps = {
	/**
	 * The applied preset, or undefined while a custom range drives the period.
	 */
	presetId?: PrimaryPresetId;

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
};

/**
 * The dashboard's period picker: one trigger naming the applied period, and a
 * menu of the common ones grouped by scale.
 */
export function DatePeriodDropdown( {
	presetId,
	appliedRange,
	presetIds,
	allTimeStart,
	timeZone,
	onSelect,
}: DatePeriodDropdownProps ) {
	const groups = useMemo(
		() => getMenuSurfacePresetGroups( timeZone, { presetIds, startDate: allTimeStart } ),
		[ allTimeStart, presetIds, timeZone ]
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
		const applied = groups.flat().find( preset => preset.id === presetId );

		return applied?.label ?? formatDateRangeNatural( appliedRange );
	}, [ appliedRange, groups, presetId ] );

	return (
		<Dropdown
			className="date-period-dropdown"
			popoverProps={ { placement: 'bottom-start' } }
			renderToggle={ ( { isOpen, onToggle } ) => (
				// The label names the period, so the dates live here: the design
				// keeps them off the control's face.
				<Tooltip text={ formatDateRange( appliedRange ) }>
					<Button
						className="date-period-dropdown__toggle"
						variant="minimal"
						tone="neutral"
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
				<NavigableMenu
					className="date-period-dropdown__menu"
					role="menu"
					aria-label={ __( 'Period', 'jetpack-premium-analytics-pkg' ) }
				>
					{ groups.map( group => (
						<MenuGroup key={ group[ 0 ].id }>
							{ group.map( preset => {
								const isSelected = preset.id === presetId;

								return (
									<MenuItem
										key={ preset.id }
										role="menuitemradio"
										isSelected={ isSelected }
										icon={ isSelected ? check : undefined }
										onClick={ () => {
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
				</NavigableMenu>
			) }
		/>
	);
}
