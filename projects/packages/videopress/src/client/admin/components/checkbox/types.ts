import { InputHTMLAttributes } from 'react';

export interface CheckboxProps extends Omit< InputHTMLAttributes< HTMLInputElement >, 'onChange' > {
	checked?: boolean;
	onChange?: ( checked: boolean ) => void;
}
