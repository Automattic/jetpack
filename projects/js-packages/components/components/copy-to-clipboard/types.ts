import type { Button } from '@wordpress/components';
import type { ComponentProps } from 'react';

export type CopyToClipboardProps = ComponentProps< typeof Button > & {
	buttonStyle?: 'icon' | 'text' | 'icon-text';
	textToCopy: string | ( () => string );
	onCopy?: VoidFunction;
};
