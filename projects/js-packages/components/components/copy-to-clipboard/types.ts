import type { Button } from '@wordpress/components';
import type { ComponentProps, ReactNode } from 'react';

export type CopyToClipboardProps = Omit<
	ComponentProps< typeof Button >,
	'children' | 'icon' | 'text'
> & {
	textToCopy: string | ( () => string );
	onCopy?: () => void;
	buttonStyle?: 'icon' | 'text' | 'icon-text';
	copyMessage?: string;
	copiedMessage?: string;
	children?: ReactNode;
};
