import { __, isRTL } from '@wordpress/i18n';
import { calendar, chevronLeft, chevronRight } from '@wordpress/icons';
import { Button, IconButton, Menu, Stack } from '@wordpress/ui';
import type { PeriodSelectorProps } from './types.ts';
import type { JSX } from 'react';

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
	disabled = false,
	className,
}: PeriodSelectorProps< Value > ): JSX.Element {
	const selected = presets.find( preset => preset.value === value );
	const [ previousIcon, nextIcon ] = isRTL()
		? [ chevronRight, chevronLeft ]
		: [ chevronLeft, chevronRight ];

	return (
		<Stack direction="row" align="center" gap="xs" className={ className }>
			<Menu.Root>
				<Menu.Trigger
					render={ <Button variant="outline" tone="neutral" size="compact" /> }
					disabled={ disabled }
				>
					<Button.Icon icon={ calendar } />
					{ selected?.label ?? __( 'Select period', 'jetpack-components' ) }
				</Menu.Trigger>
				<Menu.Popup positioner={ <Menu.Positioner align="end" /> }>
					<Menu.RadioGroup value={ value } onValueChange={ onChange }>
						{ presets.map( preset => (
							<Menu.RadioItem key={ preset.value } value={ preset.value } closeOnClick>
								<Menu.ItemLabel>{ preset.label }</Menu.ItemLabel>
							</Menu.RadioItem>
						) ) }
					</Menu.RadioGroup>
				</Menu.Popup>
			</Menu.Root>
			{ onPrevious && (
				<IconButton
					variant="outline"
					tone="neutral"
					size="compact"
					icon={ previousIcon }
					label={ __( 'Previous period', 'jetpack-components' ) }
					onClick={ onPrevious }
					disabled={ disabled || isPreviousDisabled }
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
					disabled={ disabled || isNextDisabled }
				/>
			) }
		</Stack>
	);
}
