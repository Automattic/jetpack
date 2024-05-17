import { ButtonProps } from '../button/types';

export type CopyToClipboardProps = ButtonProps & {
	buttonStyle?: 'icon' | 'text' | 'icon-text';
	textToCopy: string | ( () => string );
	onCopy?: VoidFunction;
};
