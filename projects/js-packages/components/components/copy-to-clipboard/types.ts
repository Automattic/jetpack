import { ButtonProps } from '../button/types.js';

export type CopyToClipboardProps = ButtonProps & {
	buttonStyle?: 'icon' | 'text' | 'icon-text';
	textToCopy: string | ( () => string );
	onCopy?: VoidFunction;
};
