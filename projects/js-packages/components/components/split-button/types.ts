/**
 * External dependencies
 */
import type { Button, DropdownMenu } from '@wordpress/components';

type AllowedDropdownMenuProps = Pick<
	DropdownMenu.PropsWithControls,
	'controls' | 'popoverProps' | 'toggleProps' | 'label'
>;

export type SplitButtonProps = Omit< Button.ButtonProps, 'controls' > &
	AllowedDropdownMenuProps &
	// make `controls` prop required
	Required< Pick< AllowedDropdownMenuProps, 'controls' > >;
