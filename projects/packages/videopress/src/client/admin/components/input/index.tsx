/**
 * External dependencies
 */
import { SearchIcon } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import classnames from 'classnames';
import { useCallback, ChangeEvent, KeyboardEvent } from 'react';
/**
 * Internal dependencies
 */
import styles from './style.module.scss';
import { InputProps, SearchInputProps } from './types';
import type React from 'react';

/**
 * Input component
 *
 * @param {InputProps} props - Component props.
 * @returns {React.ReactNode} - Input react component.
 */
export const Input = ( {
	className,
	value,
	placeholder,
	disabled = false,
	icon,
	onChange,
	onEnter,
}: InputProps ) => {
	const handleChangeEvent = useCallback(
		( e: ChangeEvent< HTMLInputElement > ) => {
			if ( onChange != null ) {
				onChange( e.currentTarget.value );
			}
		},
		[ onChange ]
	);

	const handleKeyUpEvent = useCallback(
		( e: KeyboardEvent< HTMLInputElement > ) => {
			if ( onEnter != null && e.code === 'Enter' ) {
				onEnter( e.currentTarget.value );
			}
		},
		[ onEnter ]
	);

	return (
		<div className={ classnames( className, styles.wrapper, { [ styles.disabled ]: disabled } ) }>
			{ icon }
			<input
				placeholder={ placeholder }
				value={ value }
				className={ classnames( styles.input, { [ styles[ 'with-icon' ] ]: icon != null } ) }
				onChange={ handleChangeEvent }
				onKeyUp={ handleKeyUpEvent }
				disabled={ disabled }
				aria-disabled={ disabled }
			/>
		</div>
	);
};

/**
 * Search Input component
 *
 * @param {InputProps} props - Component props.
 * @returns {React.ReactNode} - Input react component.
 */
export const SearchInput = ( {
	placeholder = __( 'Search your library', 'jetpack-videopress-pkg' ),
	...componentProps
}: SearchInputProps ) => {
	return (
		<Input { ...componentProps } icon={ <SearchIcon size={ 24 } /> } placeholder={ placeholder } />
	);
};

export default Input;
