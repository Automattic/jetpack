import { InputHTMLAttributes } from 'react';
import type { ReactNode } from 'react';

export interface CheckboxProps extends Omit< InputHTMLAttributes< HTMLInputElement >, 'onChange' > {
	checked?: boolean;
	htmlFor?: string;
	children?: ReactNode;
	onChange?: ( checked: boolean ) => void;
	dataTestId?: string;
}
