/**
 * External dependencies
 */
import clsx from 'clsx';
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
	( { checked, onChange, className, children, htmlFor, dataTestId, ...inputProps }, ref ) => {
		const handleCheckboxChange = e => {
			onChange?.( e.target.checked );
		};

		return (
			<label
				htmlFor={ htmlFor }
				className={ styles[ 'checkbox-container' ] }
				data-testid={ dataTestId }
			>
				<input
					{ ...inputProps }
					ref={ ref }
					type="checkbox"
					checked={ checked }
					className={ clsx( className, styles.checkbox ) }
					onChange={ handleCheckboxChange }
				/>
				<span className={ styles[ 'checkbox-checkmark' ] } />
				{ children }
			</label>
		);
	}
);
Checkbox.displayName = 'Checkbox';

export default Checkbox;
