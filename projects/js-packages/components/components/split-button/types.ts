/**
 * External dependencies
 */
import type { Button, DropdownMenu } from '@wordpress/components';

type AllowedDropdownMenuProps = Pick<
	React.ComponentProps< typeof DropdownMenu >,
	'controls' | 'popoverProps' | 'toggleProps' | 'label'
>;

export type SplitButtonProps = Omit< React.ComponentProps< typeof Button >, 'controls' > &
	AllowedDropdownMenuProps &
	// make `controls` prop required
	Required< Pick< AllowedDropdownMenuProps, 'controls' > >;
