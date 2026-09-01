import type { Button, DropdownMenu } from '@wordpress/components';
import type { ComponentProps } from 'react';

type AllowedDropdownMenuProps = Pick<
	ComponentProps< typeof DropdownMenu >,
	'controls' | 'popoverProps' | 'toggleProps' | 'label'
>;

export type SplitButtonProps = Omit< ComponentProps< typeof Button >, 'controls' > &
	AllowedDropdownMenuProps &
	// make `controls` prop required
	Required< Pick< AllowedDropdownMenuProps, 'controls' > >;
