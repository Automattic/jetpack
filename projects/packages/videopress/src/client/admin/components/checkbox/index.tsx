/**
 * External dependencies
 */
import classnames from 'classnames';
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
	( { checked, onChange, className, ...inputProps }, ref ) => {
		const handleCheckboxChange = e => {
			onChange?.( e.target.checked );
		};

		return (
			<input
				{ ...inputProps }
				ref={ ref }
				type="checkbox"
				checked={ checked }
				className={ classnames( className, styles.checkbox ) }
				onChange={ handleCheckboxChange }
			/>
		);
	}
);

export default Checkbox;
