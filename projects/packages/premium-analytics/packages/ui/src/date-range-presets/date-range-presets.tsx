/**
 * External dependencies
 */
import {
	PRESET_CUSTOM,
	getDefaultDateRangePresets,
	type PrimaryPresetId,
	type DateRangePreset,
} from '@jetpack-premium-analytics/datetime';
import { privateApis as componentsPrivateApis } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useMemo } from 'react';
/**
 * Internal dependencies
 */
import { DateRangePopover } from '../date-range-popover/date-range-filter';
import { unlock } from '../lock/unlock';
import './date-range-presets.scss';

const { Menu } = unlock( componentsPrivateApis );

type DateRange = Parameters< typeof DateRangePopover >[ 0 ][ 'range' ];

/**
 * Props for the DateRangePresets component.
 */
type DateRangePresetsProps = {
	/**
	 * Callback fired when a preset is selected
	 */
	onRangeChange: ( range: DateRange, id: PrimaryPresetId ) => void;

	/**
	 * Currently selected preset ID, or null if none
	 */
	value: PrimaryPresetId | null;

	/**
	 * IANA timezone string (e.g., 'America/New_York').
	 * Required when using default presets. Optional if explicit presets are provided.
	 */
	timeZone?: string;

	/**
	 * Custom presets to display instead of defaults
	 */
	presets?: DateRangePreset[];

	/**
	 * Whether to show the custom date option
	 */
	supportCustom?: boolean;

	/**
	 * Optional callback to clear/remove comparison.
	 * When provided, shows a "No comparison" option.
	 */
	onClear?: () => void;

	/**
	 * Whether clicking a preset item should close the parent popover.
	 * Defaults to undefined (Ariakit default: checkbox items stay open).
	 */
	hideOnClick?: boolean;
};

export function DateRangePresets( {
	onRangeChange,
	value,
	timeZone,
	presets: presetsProp,
	onClear,
	hideOnClick,
}: DateRangePresetsProps ) {
	const defaultPresets = useMemo( () => {
		if ( presetsProp ) {
			return [];
		}

		if ( ! timeZone ) {
			throw new Error(
				'DateRangePresets: `timeZone` is required when `presets` are not provided.'
			);
		}

		return getDefaultDateRangePresets( timeZone );
	}, [ presetsProp, timeZone ] );

	const presets = useMemo( () => presetsProp || defaultPresets, [ presetsProp, defaultPresets ] );

	return (
		<>
			<Menu.Group className="date-range-presets">
				{ presets.map( ( { id, label, range: presetRange } ) => (
					<Menu.CheckboxItem
						key={ label }
						className="date-range-presets__item"
						name="date-preset"
						value={ id }
						checked={ value === id }
						onChange={ () => onRangeChange( presetRange, id ) }
						hideOnClick={ hideOnClick }
					>
						<Menu.ItemLabel>{ label }</Menu.ItemLabel>
					</Menu.CheckboxItem>
				) ) }
			</Menu.Group>

			<Menu.Separator />

			<Menu.Group className="date-range-presets__custom-group">
				<Menu.CheckboxItem
					className="date-range-presets__item date-range-presets__custom"
					key="custom"
					name="date-preset"
					value={ PRESET_CUSTOM }
					checked={ value === PRESET_CUSTOM }
					disabled
				>
					<Menu.ItemLabel>{ __( 'Custom', 'jetpack-premium-analytics' ) }</Menu.ItemLabel>
				</Menu.CheckboxItem>

				{ onClear && (
					<Menu.CheckboxItem
						className="date-range-presets__item"
						key="no-comparison"
						name="date-preset"
						value="no-comparison"
						checked={ value === null }
						onChange={ onClear }
						hideOnClick
					>
						<Menu.ItemLabel>{ __( 'No comparison', 'jetpack-premium-analytics' ) }</Menu.ItemLabel>
					</Menu.CheckboxItem>
				) }
			</Menu.Group>
		</>
	);
}
