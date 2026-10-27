import { Dropdown, MenuGroup, MenuItem } from '@wordpress/components';
import { __, isRTL } from '@wordpress/i18n';
import { calendar, chevronLeft, chevronRight } from '@wordpress/icons';
import { Button, IconButton, Stack } from '@wordpress/ui';
import { useCallback } from 'react';
import type { PeriodPreset, PeriodSelectorProps } from './types.ts';
import type { JSX } from 'react';

type PresetItemProps< Value extends string > = {
	preset: PeriodPreset< Value >;
	isSelected: boolean;
	onSelect: ( value: Value ) => void;
	onClose: () => void;
};

/**
 * One preset in the menu.
 *
 * @param {PresetItemProps} props - Component props.
 * @return {JSX.Element} The menu item.
 */
function PresetItem< Value extends string >( {
	preset,
	isSelected,
	onSelect,
	onClose,
}: PresetItemProps< Value > ): JSX.Element {
	const handleClick = useCallback( () => {
		onSelect( preset.value );
		onClose();
	}, [ onSelect, onClose, preset.value ] );

	return (
		<MenuItem role="menuitemradio" isSelected={ isSelected } onClick={ handleClick }>
			{ preset.label }
		</MenuItem>
	);
}

const POPOVER_PROPS = { placement: 'bottom-end' } as const;

/**
 * A dropdown of period presets, with optional buttons to step to the previous or next period.
 *
 * @param {PeriodSelectorProps} props - Component props.
 * @return {JSX.Element} The selector.
 */
export default function PeriodSelector< Value extends string >( {
	presets,
	value,
	onChange,
	onPrevious,
	onNext,
	isPreviousDisabled = false,
	isNextDisabled = false,
	className,
}: PeriodSelectorProps< Value > ): JSX.Element {
	const selected = presets.find( preset => preset.value === value );
	const [ previousIcon, nextIcon ] = isRTL()
		? [ chevronRight, chevronLeft ]
		: [ chevronLeft, chevronRight ];

	const renderToggle = useCallback(
		( { isOpen, onToggle }: { isOpen: boolean; onToggle: () => void } ) => (
			<Button
				variant="outline"
				tone="neutral"
				size="compact"
				onClick={ onToggle }
				aria-expanded={ isOpen }
				aria-haspopup="menu"
			>
				<Button.Icon icon={ calendar } />
				{ selected?.label }
			</Button>
		),
		[ selected?.label ]
	);
	const renderContent = useCallback(
		( { onClose }: { onClose: () => void } ) => (
			<MenuGroup>
				{ presets.map( preset => (
					<PresetItem
						key={ preset.value }
						preset={ preset }
						isSelected={ preset.value === value }
						onSelect={ onChange }
						onClose={ onClose }
					/>
				) ) }
			</MenuGroup>
		),
		[ presets, value, onChange ]
	);

	return (
		<Stack direction="row" align="center" gap="xs" className={ className }>
			<Dropdown
				popoverProps={ POPOVER_PROPS }
				renderToggle={ renderToggle }
				renderContent={ renderContent }
			/>
			{ onPrevious && (
				<IconButton
					variant="outline"
					tone="neutral"
					size="compact"
					icon={ previousIcon }
					label={ __( 'Previous period', 'jetpack-components' ) }
					onClick={ onPrevious }
					disabled={ isPreviousDisabled }
				/>
			) }
			{ onNext && (
				<IconButton
					variant="outline"
					tone="neutral"
					size="compact"
					icon={ nextIcon }
					label={ __( 'Next period', 'jetpack-components' ) }
					onClick={ onNext }
					disabled={ isNextDisabled }
				/>
			) }
		</Stack>
	);
}
