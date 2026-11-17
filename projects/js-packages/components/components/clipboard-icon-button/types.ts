import type { IconButton } from '@wordpress/ui';
import type { ComponentProps } from 'react';

export type ClipboardIconButtonProps = Omit<
	ComponentProps< typeof IconButton >,
	'label' | 'icon' | 'onCopy'
> & {
	/** Text to copy, or a function that returns it. */
	text: string | ( () => string );
	/** Accessible name and tooltip. It stays the same after copying. Defaults to "Copy". */
	label?: string;
	/** Icon shown before copying. Defaults to the copy icon. */
	icon?: ComponentProps< typeof IconButton >[ 'icon' ];
	/** Called after a successful copy. */
	onCopy?: () => void;
};
