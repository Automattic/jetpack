/**
 * External dependencies
 */
import { Button, Icon, Stack } from '@jetpack-premium-analytics/externals';
import { formatDateRange } from '@jetpack-premium-analytics/formatters';
import { MenuGroup, MenuItem, NavigableMenu } from '@wordpress/components';
import { __, _x } from '@wordpress/i18n';
import { check, chevronDown, plus } from '@wordpress/icons';
import { useCallback, useMemo, useState } from 'react';
/**
 * Internal dependencies
 */
import { DateControlPopover } from '../date-control-popover';
import {
	DATE_CONTROL_TRIGGER_DEFAULTS,
	openOnArrowDown,
	type DateControlTriggerProps,
} from '../utils/date-control-trigger';
import type { ComparisonDateRangePreset } from '../use-comparison-date-presets';
import type { ComparisonPresetId } from '@jetpack-premium-analytics/datetime';

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
	/** The trigger's look, over a neutral outline at the default size. */
	triggerProps?: DateControlTriggerProps;
	onPresetChange: ( id: ComparisonPresetId ) => void;
	onClear: () => void;
};

export function DateComparisonDropdown( {
	presets,
	enabled,
	presetId,
	label,
	disabled = false,
	triggerProps,
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
	const [ isOpen, setIsOpen ] = useState( false );

	/*
	 * Additive: `Compare +` until a preset is picked, then a trigger naming it —
	 * spelled out rather than a bare `+`, since a glyph alone read as decoration.
	 * Names the preset, not the period.
	 */
	return (
		<Stack direction="row" align="center" gap="sm">
			{ selectedPreset ? (
				<span>
					{ _x(
						'vs',
						'prefix naming what a report is compared against',
						'jetpack-premium-analytics-pkg'
					) }
				</span>
			) : null }

			<DateControlPopover
				align="start"
				title={ controlLabel }
				open={ isOpen }
				onOpenChange={ setIsOpen }
				// The window the abbreviation stands for. Over the additive state
				// a tooltip would repeat the label, so it stays empty there.
				tooltip={ selectedPreset && formatDateRange( selectedPreset.range ) }
				trigger={
					<Button
						{ ...DATE_CONTROL_TRIGGER_DEFAULTS }
						{ ...triggerProps }
						disabled={ disabled }
						onKeyDown={ openOnArrowDown( {
							isOpen,
							onToggle: () => setIsOpen( true ),
							disabled,
						} ) }
						// The trigger shows an abbreviation, so carry the full preset name
						// for anyone not reading the glyphs — same as the preset pills.
						aria-label={ selectedPreset?.label }
					>
						{ selectedPreset?.shortLabel ?? additiveLabel }
						<Icon icon={ isComparisonActive ? chevronDown : plus } size={ 18 } />
					</Button>
				}
			>
				<NavigableMenu role="menu" aria-label={ controlLabel }>
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
										setIsOpen( false );
									} }
								>
									{ item.label }
								</MenuItem>
							);
						} ) }
					</MenuGroup>
				</NavigableMenu>
			</DateControlPopover>
		</Stack>
	);
}
