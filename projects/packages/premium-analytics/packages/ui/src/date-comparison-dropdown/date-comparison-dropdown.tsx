/**
 * External dependencies
 */
import { formatDateRange } from '@jetpack-premium-analytics/formatters';
import { privateApis as componentsPrivateApis } from '@wordpress/components';
import { sprintf, __ } from '@wordpress/i18n';
import { Button } from '@wordpress/ui';
import { useMemo } from 'react';
/**
 * Internal dependencies
 */
import { DateRangePresets } from '../date-range-presets';
import { unlock } from '../lock/unlock';
import type { ComparisonDateRangePreset } from '../use-comparison-date-presets';
import type {
	ComparisonPresetId,
	DateRangePreset,
	PrimaryPresetId,
} from '@jetpack-premium-analytics/datetime';
import './date-comparison-dropdown.scss';

const { Menu } = unlock( componentsPrivateApis );

type DateComparisonDropdownProps = {
	/**
	 * Available comparison presets (e.g., previous-period, previous-month)
	 */
	presets: ComparisonDateRangePreset[];
	/**
	 * Whether comparison is enabled
	 */
	enabled: boolean;
	/**
	 * Currently selected comparison preset ID
	 */
	presetId?: ComparisonPresetId;
	/**
	 * Whether to remove "Compare to:" prefix from button label
	 */
	removeCompareToPrefix?: boolean;
	/**
	 * Callback when comparison is enabled
	 */
	onEnable: () => void;
	/**
	 * Callback when a comparison preset is selected
	 */
	onPresetChange: ( id: ComparisonPresetId ) => void;
	/**
	 * Callback when comparison is cleared
	 */
	onClear: () => void;
};

export function DateComparisonDropdown( {
	presets,
	enabled,
	presetId,
	removeCompareToPrefix = false,
	onEnable,
	onPresetChange,
	onClear,
}: DateComparisonDropdownProps ) {
	const selectedPreset = useMemo(
		() => ( presetId ? presets.find( p => p.id === presetId ) : undefined ),
		[ presets, presetId ]
	);

	const comparisonRange = selectedPreset?.range;
	const hasValidPreset = !! comparisonRange;
	const hasPresets = presets.length > 0;

	if ( ! enabled ) {
		return (
			<Menu>
				<Menu.TriggerButton
					render={
						<Button
							className="date-filters-panel-button"
							variant="outline"
							tone="neutral"
							size="compact"
							id="date-comparison-dropdown-button"
						>
							{ __( 'No comparison', 'jetpack-premium-analytics' ) }
						</Button>
					}
				/>
				<Menu.Popover className="date-comparison-dropdown__popover">
					<Menu.Group>
						<Menu.CheckboxItem name="comparison-toggle" value="no-comparison" checked={ true }>
							<Menu.ItemLabel>
								{ __( 'No comparison', 'jetpack-premium-analytics' ) }
							</Menu.ItemLabel>
						</Menu.CheckboxItem>

						<Menu.CheckboxItem
							name="comparison-toggle"
							value="comparison-to-past"
							checked={ false }
							onChange={ onEnable }
							hideOnClick
						>
							<Menu.ItemLabel>
								{ __( 'Comparison to past', 'jetpack-premium-analytics' ) }
							</Menu.ItemLabel>
						</Menu.CheckboxItem>
					</Menu.Group>
				</Menu.Popover>
			</Menu>
		);
	}

	let label: string = __( 'Select comparison', 'jetpack-premium-analytics' );
	if ( hasValidPreset ) {
		if ( removeCompareToPrefix ) {
			label = formatDateRange( comparisonRange );
		} else {
			label = sprintf(
				// translators: %s is the comparison range label
				__( 'Compare to: %s', 'jetpack-premium-analytics' ),
				formatDateRange( comparisonRange )
			);
		}
	}

	return (
		<Menu>
			<Menu.TriggerButton
				render={
					<Button
						className="date-comparison-dropdown__button"
						variant="outline"
						tone="neutral"
						size="compact"
					>
						{ label }
					</Button>
				}
			/>
			<Menu.Popover className="date-comparison-dropdown__popover">
				{ hasPresets && (
					<DateRangePresets
						/*
						 * DateRangePresets is typed for primary presets, but it only
						 * reads `id`/`label`/`range` to render each row, so it renders
						 * comparison presets identically. Cast to the primary-preset
						 * prop types; the runtime shape matches.
						 */
						value={ ( presetId ?? null ) as PrimaryPresetId | null }
						presets={ presets as unknown as DateRangePreset[] }
						hideOnClick
						onRangeChange={ ( _range, id ) => {
							/*
							 * Type assertion is safe here because:
							 * 1. presets is ComparisonDateRangePreset[] (strongly typed)
							 * 2. DateRangePresets picks id from our presets array
							 * 3. Therefore id must be ComparisonPresetId
							 */
							onPresetChange( id as ComparisonPresetId );
						} }
						onClear={ onClear }
					/>
				) }
			</Menu.Popover>
		</Menu>
	);
}
