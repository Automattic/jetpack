/**
 * External dependencies
 */
import { DropdownMenu, MenuGroup, MenuItem } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { check, chevronDown, plus } from '@wordpress/icons';
import clsx from 'clsx';
import { useCallback, useMemo } from 'react';
/**
 * Internal dependencies
 */
import type { ComparisonDateRangePreset } from '../use-comparison-date-presets';
import type { ComparisonPresetId } from '@jetpack-premium-analytics/datetime';
import './date-comparison-dropdown.scss';

const NO_COMPARISON_VALUE = 'no-comparison';

type ComparisonMenuItem = {
	value: string;
	label: string;
};

type DateComparisonDropdownProps = {
	/**
	 * Available comparison presets (e.g., previous-period, previous-month)
	 */
	presets: ComparisonDateRangePreset[];
	enabled: boolean;
	presetId?: ComparisonPresetId;
	/**
	 * Names the trigger, and with no comparison active is also its visible
	 * text. Defaults to "Compare" / "Compare to" depending on the state.
	 */
	label?: string;
	onPresetChange: ( id: ComparisonPresetId ) => void;
	onClear: () => void;
};

export function DateComparisonDropdown( {
	presets,
	enabled,
	presetId,
	label,
	onPresetChange,
	onClear,
}: DateComparisonDropdownProps ) {
	const noComparisonLabel = __( 'No comparison', 'jetpack-premium-analytics-pkg' );
	const additiveLabel = __( 'Compare', 'jetpack-premium-analytics-pkg' );
	const compareToLabel = __( 'Compare to', 'jetpack-premium-analytics-pkg' );

	const items = useMemo( (): ComparisonMenuItem[] => {
		return [
			{
				value: NO_COMPARISON_VALUE,
				label: noComparisonLabel,
			},
			...presets.map( preset => ( {
				value: preset.id,
				label: preset.label,
			} ) ),
		];
	}, [ noComparisonLabel, presets ] );

	// A preset the current range cannot produce leaves the trigger with nothing
	// to name, so the control falls back to its additive state.
	const selectedPreset = useMemo(
		() => ( enabled && presetId ? presets.find( preset => preset.id === presetId ) : undefined ),
		[ enabled, presetId, presets ]
	);

	const selectedValue = selectedPreset?.id ?? NO_COMPARISON_VALUE;
	const isComparisonActive = !! selectedPreset;

	const handleSelect = useCallback(
		( value: string ) => {
			if ( value === NO_COMPARISON_VALUE ) {
				onClear();
				return;
			}

			onPresetChange( value as ComparisonPresetId );
		},
		[ onClear, onPresetChange ]
	);

	/*
	 * Additive: `Compare +` until a preset is picked, then a trigger naming it.
	 * Both open the same menu, so the way back to "No comparison" is the way in.
	 *
	 * The additive state spells itself out rather than offering a bare `+`: a
	 * glyph alone left the one control on the row that adds something reading
	 * as decoration, and its purpose behind a hover.
	 *
	 * It names the preset rather than the period it resolves to, which the
	 * section header's subtitle already spells out.
	 */
	return (
		<DropdownMenu
			className="date-comparison-dropdown"
			icon={ isComparisonActive ? chevronDown : plus }
			text={ selectedPreset?.shortLabel ?? additiveLabel }
			label={ label ?? ( isComparisonActive ? compareToLabel : additiveLabel ) }
			popoverProps={ { placement: 'bottom-start' } }
			toggleProps={ {
				className: clsx( 'date-comparison-dropdown__toggle', {
					'date-comparison-dropdown__toggle--active': isComparisonActive,
				} ),
				iconPosition: 'right',
				iconSize: 18,
				// A tooltip only where the trigger's text is an abbreviation.
				// Over the additive state it would repeat the label beneath it.
				showTooltip: isComparisonActive,
				// The trigger shows an abbreviation, so carry the full preset
				// name for anyone not reading the glyphs. Same treatment the
				// preset pills give their short labels.
				'aria-label': selectedPreset?.label,
			} }
		>
			{ ( { onClose } ) => (
				<MenuGroup>
					{ items.map( item => {
						const isSelected = item.value === selectedValue;

						return (
							<MenuItem
								key={ item.value }
								role="menuitemradio"
								isSelected={ isSelected }
								icon={ isSelected ? check : undefined }
								onClick={ () => {
									handleSelect( item.value );
									onClose();
								} }
							>
								{ item.label }
							</MenuItem>
						);
					} ) }
				</MenuGroup>
			) }
		</DropdownMenu>
	);
}
