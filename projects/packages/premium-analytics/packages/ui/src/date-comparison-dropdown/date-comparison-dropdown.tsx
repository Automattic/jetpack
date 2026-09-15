/**
 * External dependencies
 */
import { formatDateRange } from '@jetpack-premium-analytics/formatters';
import { DropdownMenu, MenuGroup, MenuItem } from '@wordpress/components';
import { __, _x } from '@wordpress/i18n';
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
	/** Greys the trigger out but keeps it focusable: a passing state, not a missing control. */
	disabled?: boolean;
	onPresetChange: ( id: ComparisonPresetId ) => void;
	onClear: () => void;
};

export function DateComparisonDropdown( {
	presets,
	enabled,
	presetId,
	label,
	disabled = false,
	onPresetChange,
	onClear,
}: DateComparisonDropdownProps ) {
	const noComparisonLabel = __( 'No comparison', 'jetpack-premium-analytics-pkg' );
	const additiveLabel = __( 'Compare', 'jetpack-premium-analytics-pkg' );
	const compareToLabel = __( 'Compare to', 'jetpack-premium-analytics-pkg' );

	// "No comparison" closes the menu as the way out, after the options.
	const items = useMemo( (): ComparisonMenuItem[] => {
		return [
			...presets.map( preset => ( {
				value: preset.id,
				label: preset.label,
			} ) ),
			{
				value: NO_COMPARISON_VALUE,
				label: noComparisonLabel,
			},
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

	const controlLabel = label ?? ( isComparisonActive ? compareToLabel : additiveLabel );

	/*
	 * Additive: `Compare +` until a preset is picked, then a trigger naming it —
	 * spelled out rather than a bare `+`, since a glyph alone read as decoration.
	 * Names the preset, not the period.
	 */
	return (
		<div className={ clsx( 'date-comparison-dropdown', { 'is-disabled': disabled } ) }>
			{ selectedPreset ? (
				<span className="date-comparison-dropdown__prefix">
					{ _x(
						'vs',
						'prefix naming what a report is compared against',
						'jetpack-premium-analytics-pkg'
					) }
				</span>
			) : null }

			<DropdownMenu
				className="date-comparison-dropdown__menu"
				icon={ isComparisonActive ? chevronDown : plus }
				text={ selectedPreset?.shortLabel ?? additiveLabel }
				// The window the abbreviation stands for. `label` is the toggle's
				// tooltip and the menu's name both, so the menu keeps its own.
				label={ selectedPreset ? formatDateRange( selectedPreset.range ) : controlLabel }
				menuProps={ { 'aria-label': controlLabel } }
				popoverProps={ { placement: 'bottom-start' } }
				// An aria-disabled Button drops clicks but not keys, so the arrow shortcut is shut apart.
				disableOpenOnArrowDown={ disabled }
				toggleProps={ {
					className: clsx( 'date-comparison-dropdown__toggle', {
						'date-comparison-dropdown__toggle--active': isComparisonActive,
					} ),
					disabled,
					accessibleWhenDisabled: true,
					iconPosition: 'right',
					iconSize: 18,
					// A tooltip only where the trigger's text is an abbreviation.
					// Over the additive state it would repeat the label beneath it.
					showTooltip: isComparisonActive,
					// The trigger shows an abbreviation, so carry the full preset name
					// for anyone not reading the glyphs — same as the preset pills.
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
		</div>
	);
}
