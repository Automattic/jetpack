/**
 * External dependencies
 */
import { forwardRef } from 'react';
/**
 * Internal dependencies
 */
import styles from './style.module.scss';
/**
 * Types
 */
import { CheckboxProps } from './types';

const Checkbox = forwardRef< HTMLInputElement, CheckboxProps >(
	( { checked, onChange, ...inputProps }, ref ) => {
		const handleCheckboxChange = e => {
			onChange?.( e.target.checked );
		};

		return (
			<input
				{ ...inputProps }
				ref={ ref }
				type="checkbox"
				checked={ checked }
				className={ styles.checkbox }
				onChange={ handleCheckboxChange }
			/>
		);
	}
);

export default Checkbox;
