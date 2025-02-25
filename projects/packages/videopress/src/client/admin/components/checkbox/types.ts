import { InputHTMLAttributes } from 'react';

export interface CheckboxProps extends Omit< InputHTMLAttributes< HTMLInputElement >, 'onChange' > {
	checked?: boolean;
	htmlFor?: string;
	children?: React.ReactNode;
	onChange?: ( checked: boolean ) => void;
	dataTestId?: string;
}
