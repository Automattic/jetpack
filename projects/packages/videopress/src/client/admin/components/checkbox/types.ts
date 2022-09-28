import { InputHTMLAttributes } from 'react';

export interface CheckboxProps extends InputHTMLAttributes< HTMLInputElement > {
	checked?: boolean;
	onChange?: ( checked: boolean ) => void;
}
