import type { Button, DropdownMenu } from '@wordpress/components';
import type { ComponentProps } from 'react';

type AllowedDropdownMenuProps = Pick<
	ComponentProps< typeof DropdownMenu >,
	'controls' | 'popoverProps' | 'toggleProps' | 'label'
>;

export type SplitButtonProps = Omit<
	// Extract only the button props to avoid the link props polluting the type.
	Extract<
		ComponentProps< typeof Button >,
		{ onClick?: React.MouseEventHandler< HTMLButtonElement > }
	>,
	'controls'
> &
	AllowedDropdownMenuProps &
	// make `controls` prop required
	Required< Pick< AllowedDropdownMenuProps, 'controls' > >;
